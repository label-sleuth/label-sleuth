import itertools
import logging
import random
import re
import time
from concurrent.futures.thread import ThreadPoolExecutor

import numpy as np
import pandas as pd
from collections import OrderedDict, defaultdict, Counter
from enum import Enum
from typing import Mapping, List, Sequence, Tuple

from lrtc_lib import definitions
from lrtc_lib.data_access.core.utils import get_document_uri


logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s [%(threadName)s]')


from lrtc_lib.definitions import PROJECT_PROPERTIES
from lrtc_lib.orchestrator import orchestrator_api
from lrtc_lib.data_access.core.data_structs import LABEL_POSITIVE, LABEL_NEGATIVE
from lrtc_lib.orchestrator.orchestrator_api import data_access, DeleteModels
from lrtc_lib.orchestrator.core.state_api import orchestrator_state_api
from lrtc_lib.orchestrator.core.state_api.orchestrator_state_api import ActiveLearningRecommendationsStatus
from lrtc_lib.train_and_infer_service.train_and_infer_api import ModelStatus
from lrtc_lib.data_access.core.data_structs import TextElement, Label, Document
from lrtc_lib.training_set_selector.training_set_selector_factory \
    import TrainingSetSelectorFactory as training_set_selector_factory
from lrtc_lib.orchestrator import orchestrator_api
from lrtc_lib.config import *


class RecommendedAction(Enum):
    LABEL_BY_QUERY = 0
    LABEL_BY_MODEL = 1

NUMBER_OF_MODELS_TO_KEEP = 2
new_data_infer_thread_pool = ThreadPoolExecutor(1)


def create_workspace(workspace_id: str, dataset_name: str, dev_dataset_name: str = None):
    return orchestrator_api.create_workspace(**locals())


def create_new_category(workspace_id: str, category_name: str, category_description: str):
    return orchestrator_api.create_new_category(**locals())


def delete_workspace(workspace_id: str):
    return orchestrator_api.delete_workspace(workspace_id, DeleteModels.ALL)


def edit_category(workspace_id: str, prev_category_name: str, new_category_name: str, new_category_description: str):
    return orchestrator_api.edit_category(**locals())


def delete_category(workspace_id: str, category_name: str):
    return orchestrator_api.delete_category(**locals())


def add_documents(dataset_name, docs):
    return orchestrator_api.add_documents(**locals())


def estimate_precision(workspace_id, category, ids, changed_elements_count, model_id):
    # save as csv?
    dataset_name = orchestrator_state_api.get_workspace(workspace_id).dataset_name
    exam_text_elements = get_text_elements(workspace_id ,dataset_name, ids)
    positive_elements = [te for te in exam_text_elements if next(iter(te.category_to_label[category].labels)) == LABEL_POSITIVE]

    estimated_precision = len(positive_elements)/len(exam_text_elements)
    orchestrator_state_api.add_model_metadata(workspace_id,category,model_id,{"estimated_precision":estimated_precision,
                                                                              "estimated_precision_num_elements":len(ids)})
    orchestrator_state_api.increase_number_of_changes_since_last_model(workspace_id, category, changed_elements_count)
    return estimated_precision

def get_recommended_action(workspace_id: str, category_name: str) -> List[RecommendedAction]:
    """
        get the system recommendations for the next action/actions by the user


        :rtype: list of RecommendedAction. *It's possible that we will use a more complex response in the future (for
                example: label by a new query etc...)
        :param workspace_id:
        :param category_name:
    """
    workspace = orchestrator_state_api.get_workspace(workspace_id)
    category_models = workspace.category_to_models.get(category_name, {})

# all(category_models.items()))[1].model_status != ModelStatus.READY:
    if any(model_info.model_status == ModelStatus.READY for _, model_info in category_models.items()) and \
            any(al_status == ActiveLearningRecommendationsStatus.READY for model_id, al_status
                in workspace.category_to_model_to_recommendations_status[category_name].items()):
        return [RecommendedAction.LABEL_BY_MODEL]
    else:
        return [RecommendedAction.LABEL_BY_QUERY]


def query(workspace_id: str, dataset_name: str, category_name: str, query: str, unlabeled_only: bool = False,
          sample_size: int = 10, sample_start_idx:int = 0, remove_duplicates: bool = False) -> Mapping[str, object]:
    return orchestrator_api.query(**locals())


def get_documents(workspace_id: str, dataset_name: str, uris: Sequence[str]) -> List[Document]:
    return orchestrator_api.get_documents(**locals())


def get_text_elements(workspace_id: str, dataset_name: str, uris: Sequence[str]) -> List[TextElement]:
    return orchestrator_api.get_text_elements(**locals())


def get_elements_to_label(workspace_id: str, category_name: str, count: int, start_index:int = 0) -> Sequence[TextElement]:
    if not definitions.ASYNC:
        return orchestrator_api.get_elements_to_label(**locals())
    else:
        # time.sleep(45)
        # TODO check for latest model in AL results ready?
        latest_ready_model = \
            orchestrator_state_api.get_latest_model_by_state(workspace_id, category_name, ModelStatus.READY)
        if not latest_ready_model:
            logging.info(f"no elements to label for category {category_name} in workspace {workspace_id} (model not ready)")
            return []  # no model in status ready
        latest_al_ready_model_id = \
            orchestrator_state_api.get_latest_model_id_by_al_status(workspace_id, category_name,
                                                                    ActiveLearningRecommendationsStatus.READY)
        if not latest_al_ready_model_id:
            logging.info(
                f"no elements to label for category {category_name} in workspace {workspace_id}"
                f" (model is ready but AL recommendations are still missing)")
            return []  # no model with AL recommendations ready
        if latest_ready_model.model_id != latest_al_ready_model_id:
            logging.info("latest trained model AL recommendations are not ready, uses the previous model recommendations")
        recommended_uris = orchestrator_state_api.get_current_category_recommendations(workspace_id, category_name,
                                                                                       latest_al_ready_model_id)
        if start_index > len(recommended_uris):
            raise Exception(f"exceeded max recommended items. last element index is {len(recommended_uris)-1}")
        recommended_uris=recommended_uris[start_index:start_index+count]
        dataset_name = orchestrator_state_api.get_workspace(workspace_id).dataset_name
        return orchestrator_api.get_text_elements(workspace_id, dataset_name, recommended_uris)


def set_labels(workspace_id: str, labeled_sentences: Sequence[Tuple[str, Mapping[str, Label]]],
               propagate_to_duplicates=False, update_label_counter=True):
    if update_label_counter:
        # count the number of labels for each category
        changes_per_cat = Counter([cat for uri, labels_dict in labeled_sentences for cat in labels_dict])
        for cat, num_changes in changes_per_cat.items():
            orchestrator_state_api.increase_number_of_changes_since_last_model(workspace_id, cat, num_changes)
    return orchestrator_api.set_labels(workspace_id, labeled_sentences, propagate_to_duplicates)


def unset_labels(workspace_id: str, category_name, uris: Sequence[str]):
    return orchestrator_api.unset_labels(**locals())


def train_if_recommended(workspace_id: str, category_name: str, force=False):
    workspace = orchestrator_state_api.get_workspace(workspace_id)
    dataset_name = workspace.dataset_name
    models = workspace.category_to_models.get(category_name, OrderedDict())
    models_without_errors = OrderedDict()
    for mid in models:
        if models[mid].model_status != ModelStatus.ERROR:
            models_without_errors[mid] = models[mid]

    label_counts = data_access.get_label_counts(workspace_id=workspace_id, dataset_name=dataset_name,
                                                category_name=category_name, remove_duplicates=True)
    changes_since_last_model = orchestrator_state_api.get_number_of_changed_since_last_model(workspace_id,category_name)

    if force or (LABEL_POSITIVE in label_counts and label_counts[LABEL_POSITIVE]>=CONFIGURATION.first_model_positive_threshold and \
            changes_since_last_model >= CONFIGURATION.changed_element_threshold):
        if len(models_without_errors) > 0 and orchestrator_state_api.get_active_learning_status(workspace_id,
            next(reversed(models_without_errors))) != ActiveLearningRecommendationsStatus.READY:
            logging.info("new elements criterion meet but previous AL still not ready, not initiating a new training")
            return None
        orchestrator_state_api.set_number_of_changes_since_last_model(workspace_id,category_name,0)
        logging.info(f"{label_counts[LABEL_POSITIVE]} positive elements (>={CONFIGURATION.first_model_positive_threshold})"
                     f" {changes_since_last_model} elements changed since last model (>={CONFIGURATION.changed_element_threshold})"
                     f" training a new model")
        iteration_num = len(models_without_errors)
        model_type = PROJECT_PROPERTIES['model_policy'].get_model(iteration_num)
        train_and_dev_sets_selector = training_set_selector_factory.get_training_set_selector(
            selector=PROJECT_PROPERTIES["training_set_selection"])
        train_data, dev_data = train_and_dev_sets_selector.get_train_and_dev_sets(
            workspace_id=workspace_id, train_dataset_name=dataset_name,
            category_name=category_name, dev_dataset_name=workspace.dev_dataset_name)
        model_id = orchestrator_api.train(workspace_id=workspace_id, category_name=category_name,
                                          model_type=model_type, train_data=train_data, dev_data=dev_data)
        return model_id
    else:
        logging.info(f"{label_counts[LABEL_POSITIVE]} positive elements (should be >={CONFIGURATION.first_model_positive_threshold}) AND"
                     f" {changes_since_last_model} elements changed since last model (should be >={CONFIGURATION.changed_element_threshold})"
                     f" not training a new model")
        return None


def get_model_status(workspace_id: str, model_id: str) -> ModelStatus:
    return orchestrator_api.get_model_status(**locals())


def get_all_models(workspace_id):
    workspace = orchestrator_state_api.get_workspace(workspace_id)

    all_models = {k: v for d in workspace.category_to_models.values() for k, v in d.items()}
    return all_models


def get_all_models_for_category(workspace_id, category_name):
    return orchestrator_api.get_all_models_for_category(**locals())


def infer(workspace_id: str, category_name: str, elements_to_infer: Sequence[TextElement], model_id: str = None,
          infer_params: dict = None, use_cache: bool = True) -> dict:
    return orchestrator_api.infer(**locals())


def infer_by_uris(workspace_id: str, category_name: str, uris_to_infer: Sequence[str], model_id: str = None,
                  infer_params: dict = None, use_cache: bool = True) -> dict:
    return orchestrator_api.infer_by_uris(**locals())


def get_all_categories(workspace_id: str):
    return orchestrator_state_api.get_workspace(workspace_id).category_to_description


def get_all_labeled_text_elements(workspace_id, dataset_name, category) -> Sequence[TextElement]:
    return orchestrator_api.get_all_labeled_text_elements(**locals())


def sample_text_elements(workspace_id, dataset_name, sample_size,
                         random_state: int = 0) -> Sequence[TextElement]:
    return orchestrator_api.sample_text_elements(**locals())


def sample_unlabeled_text_elements(workspace_id, dataset_name, category, sample_size,
                                   random_state: int = 0) -> Sequence[TextElement]:
    return orchestrator_api.sample_unlabeled_text_elements(**locals())


def get_all_text_elements(dataset_name: str) -> Sequence[TextElement]:
    return orchestrator_api.get_all_text_elements(**locals())


def get_label_counts(workspace_id: str, dataset_name: str, category_name: str):
    return orchestrator_api.get_label_counts(**locals())






def get_progress(workspace_id: str, dataset_name: str, category: str):
    category_label_counts = orchestrator_api.get_label_counts(workspace_id, dataset_name, category)
    if category_label_counts[LABEL_POSITIVE]:
        changed_since_last_model_count = orchestrator_state_api.get_number_of_changed_since_last_model(workspace_id,category)

        return {"all": min(
            max(0, min(round(changed_since_last_model_count / CONFIGURATION.changed_element_threshold * 100), 100)),
            max(0, min(round(category_label_counts[LABEL_POSITIVE] / CONFIGURATION.first_model_positive_threshold * 100), 100))
        )
        }
    else:
        return {"all": 0 }


def workspace_exists(workspace_id: str) -> bool:
    return orchestrator_api.workspace_exists(**locals())


def get_workspace_info(workspace_id: str) -> dict:
    workspace = orchestrator_api.get_workspace(**locals())
    return {"workspace_id": workspace.workspace_id, "dataset_name": workspace.dataset_name}


def get_all_document_uris(workspace_id):
    return orchestrator_api.get_all_document_uris(**locals())


def get_model_train_counts(workspace_id, model_id):
    return orchestrator_api.get_model_train_counts(**locals())


def set_active_learning_strategy(new_active_learning_strategy):
    return orchestrator_api.set_active_learning_strategy(**locals())


def list_workspaces():
    return sorted([x.workspace_id for x in orchestrator_state_api.get_all_workspaces()])


def get_all_datasets():
    return orchestrator_api.data_access.get_all_datasets()

def get_all_models_by_state(workspace_id, category_name, model_status):
    return orchestrator_state_api.get_all_models_by_state(workspace_id, category_name, model_status)

def _post_train_method(workspace_id, category_name, model_id):
    dataset_name = orchestrator_api.get_workspace(workspace_id).dataset_name
    elements = orchestrator_api.get_all_text_elements(dataset_name)
    predictions = orchestrator_api.infer(workspace_id, category_name, elements, model_id)
    dataset_size = len(predictions["labels"])
    positive_fraction = predictions["labels"].count("true")/dataset_size
    post_train_metadata = {"positive_fraction": positive_fraction}

    category_models = get_all_models_by_state(workspace_id, category_name, ModelStatus.READY)
    if len(category_models) > 1:
        print(list(category_models)[-2])
        previous_model_id = list(category_models)[-2].model_id
        previous_model_predictions = orchestrator_api.infer(workspace_id, category_name, elements, previous_model_id)
        num_identical = sum(x == y for x, y in zip(predictions["labels"], previous_model_predictions["labels"]))
        post_train_metadata["changed_fraction"] = (dataset_size-num_identical)/dataset_size

    logging.info(f"post train measurements for model id {model_id}: {post_train_metadata}")
    orchestrator_state_api.add_model_metadata(workspace_id, category_name, model_id, post_train_metadata)


def get_model_active_learning_status(workspace_id, model_id):
    return orchestrator_api.get_model_active_learning_status(**locals())


def _post_active_learning_func(workspace_id, category_name, model):
    logging.info(f"active learning suggestions for model {model.model_id} "
                 f"of category ({category_name}) are ready")

    all_models = orchestrator_state_api.get_workspace(workspace_id).category_to_models[category_name]
    found = False
    prev_count = 0

    for model_id in reversed(all_models):
        if model_id==model.model_id:
            found = True
            prev_count+=1
        elif found:
            prev_count+=1
        if prev_count > NUMBER_OF_MODELS_TO_KEEP:
            model_to_delete = all_models[model_id]
            if model_to_delete.model_status == ModelStatus.READY:
                logging.info(f"keep only {NUMBER_OF_MODELS_TO_KEEP} models, deleting old model {model_id}")
                orchestrator_api.delete_model(workspace_id,category_name,model_id)
    logging.info(all_models)
    push_notification(workspace_id, category_name, MODEL_READY)


# def export_category_labels(workspace_id, category_name) -> pd.DataFrame:
#     dataset_name = orchestrator_api.get_workspace(workspace_id).dataset_name
#     label_count = sum(orchestrator_api.get_label_counts(workspace_id, dataset_name, category_name, False).values())
#     logging.info(f"Total label count in workspace '{workspace_id}' is {label_count}")
#     labeled_representatives = data_access.sample_labeled_text_elements(workspace_id, dataset_name, category_name, 10**6,
#                                                                        remove_duplicates=False)['results']
#     logging.info(f"Exporting {len(labeled_representatives)} unique labeled elements for category '{category_name}'"
#                  f" from workspace '{workspace_id}'")
#     # TODO currently we lose metadata information
#     list_of_dicts = [{
#         'workspace_id': workspace_id,
#         'category_name': category_name,
#         'doc_id': re.sub('-[^-]*$', '', le.uri),
#         'dataset': dataset_name,
#         'text': le.text,
#         'uri': le.uri,
#         'labels': ','.join(label for label in le.category_to_label[category_name].labels)}
#         for le in labeled_representatives]
#     return pd.DataFrame(list_of_dicts)


def import_category_labels(workspace_id, labels_df_to_import: pd.DataFrame):
    punctuation = '!"#$%&()*+,-./:;<=>?@[\\]^`{|}~ '
    binary_labels = len(set(labels_df_to_import['labels'].unique()).intersection(
        {LABEL_POSITIVE, LABEL_POSITIVE.upper(), LABEL_POSITIVE.capitalize()})) > 0
    if 'category_name' not in labels_df_to_import.columns and not binary_labels:
        labels_df_to_import['category_name'] = labels_df_to_import['labels']
        labels_df_to_import['labels'] = LABEL_POSITIVE
        if sum(labels_df_to_import['category_name'].isna()) > 0:
            negatives = labels_df_to_import[labels_df_to_import['category_name'].isna()]
            labels_df_to_import = labels_df_to_import[~labels_df_to_import['category_name'].isna()]
            for cat in labels_df_to_import['category_name'].unique():
                cat_negatives = negatives.copy()
                cat_negatives['category_name'] = cat
                cat_negatives['labels'] = LABEL_NEGATIVE
                labels_df_to_import = labels_df_to_import.append(cat_negatives)
    labels_df_to_import['category_name'] = labels_df_to_import['category_name'].apply(str)
    labels_df_to_import['category_name'] = labels_df_to_import['category_name'].apply(lambda x:
                                                                                      x.translate(x.maketrans(punctuation, '_' * len(punctuation))))
    dataset_name = orchestrator_api.get_workspace(workspace_id).dataset_name
    logging.info(f"Importing {len(labels_df_to_import)} unique labeled elements into workspace '{workspace_id}'")
    if 'dataset' in labels_df_to_import.columns:
        imported_dataset_names = set(labels_df_to_import['dataset'].values)
        assert imported_dataset_names == {dataset_name}, f'imported labels contain different dataset names from current ' \
                                                         f'workspace: {imported_dataset_names} vs. {dataset_name}'
    categories = get_all_categories(workspace_id)
    categories_counter = defaultdict(int)
    categories_created = []
    lines_skipped = []

    labels_df_to_import['labels'] = labels_df_to_import['labels'].apply(lambda x: 'true' if x.lower() in ['true', '1']
                                                                        else 'false')
    for category_name, category_df in labels_df_to_import.groupby('category_name'):
        if category_name not in categories:
            if not re.match("^[A-Za-z0-9_-]*$",category_name):
                lines_skipped.extend([f'{category_name},{text},{label}'
                                      for text, label in zip(category_df['text'], category_df['labels'])])
                continue
            logging.info(f"** category '{category_name}' is missing, creating it ** ")
            create_new_category(workspace_id, category_name, category_name + '(created during upload)')
            categories = get_all_categories(workspace_id)
            categories_created.append(category_name)

        uris_with_label = []
        if 'doc_id' in category_df.columns:
            for doc, df_for_doc in category_df.groupby('doc_id'):
                for label, df_for_label in df_for_doc.groupby('labels'):
                    regex = '|'.join(f'^{re.escape(t)}$' for t in df_for_label['text'])
                    # We DO NOT remove duplicates, because we want to make sure the text appearances in *this specific
                    # document* will come back
                    elements_from_query = orchestrator_api.query(workspace_id, dataset_name, category_name, query=regex,
                                                                 sample_size=10**6, remove_duplicates=False)['results']
                    elements_with_label = [e for e in elements_from_query if get_document_uri(e.uri) == f'{dataset_name}-{doc}']
                    uris_with_label.extend((e.uri, {category_name: Label(labels=frozenset({label}), metadata={})})
                                           for e in elements_with_label)
        else:
            for label, df_for_label in category_df.groupby('labels'):
                regex = '|'.join(f'^{re.escape(t)}$' for t in df_for_label['text'])
                elements_with_label = orchestrator_api.query(workspace_id, dataset_name, category_name, query=regex,
                                                             sample_size=10**6, remove_duplicates=True)['results']
                uris_with_label.extend((e.uri, {category_name: Label(labels=frozenset({label}), metadata={})})
                                       for e in elements_with_label)
        logging.info(f'{category_name}: adding labels for {len(uris_with_label)} uris')
        set_labels(workspace_id, uris_with_label, propagate_to_duplicates=False)

        label_counts_dict = orchestrator_api.get_label_counts(workspace_id, dataset_name, category_name, False)
        label_count = sum(label_counts_dict.values())
        logging.info(
            f"Updated total label count in workspace '{workspace_id}' for category {category_name} is {label_count}"
            f" ({label_counts_dict})")
        categories_counter[category_name] += label_counts_dict['true']

    categories_counter_list = [{'category': key, 'counter': value} for key, value in categories_counter.items()]
    total = sum(categories_counter.values())

    res = dict()
    res['categories'] = categories_counter_list
    res['categoriesCreated'] = categories_created
    res['linesSkipped']= lines_skipped
    res['total'] = total
    return res


def export_workspace_labels(workspace_id) -> pd.DataFrame:
    dataset_name = orchestrator_api.get_workspace(workspace_id).dataset_name
    categories = get_all_categories(workspace_id)
    list_of_dicts = list()
    for category in categories:
        label_count = sum(orchestrator_api.get_label_counts(workspace_id, dataset_name, category, False).values())
        logging.info(f"Total label count in workspace '{workspace_id}' is {label_count}")
        labeled_representatives = data_access.sample_labeled_text_elements(workspace_id, dataset_name, category, 10**6,
                                                                           remove_duplicates=False)['results']
        logging.info(f"Exporting {len(labeled_representatives)} unique labeled elements for category '{category}'"
                     f" from workspace '{workspace_id}'")
        # TODO currently we lose label metadata information
        list_of_dicts += [{
            'workspace_id': workspace_id,
            'category_name': category,
            'doc_id': le.uri.split('-')[1],
            'dataset': dataset_name,
            'text': le.text,
            'uri': le.uri,
            'element_metadata': le.metadata,
            'labels': ','.join(label for label in le.category_to_label[category].labels)}
            for le in labeled_representatives]
    return pd.DataFrame(list_of_dicts)



def export_model(workspace_id, model_id):
    model_type = orchestrator_api._get_model(workspace_id, model_id).model_type
    train_and_infer = PROJECT_PROPERTIES["train_and_infer_factory"].get_train_and_infer(model_type)
    exported_model_dir = train_and_infer.export_model(model_id)
    return exported_model_dir


def add_documents_from_file(dataset_name,temp_file_name):
    global new_data_infer_thread_pool
    logging.info(f"adding documents to dataset {dataset_name}")
    loaded = orchestrator_api.add_documents_from_file(dataset_name,temp_file_name)
    workspaces_to_update = []
    total_infer_jobs = 0
    for workspace_id in list_workspaces():
        workspace = orchestrator_api.get_workspace(workspace_id)
        if workspace.dataset_name == dataset_name:
            workspaces_to_update.append(workspace_id)
            for category, model_id_to_model in workspace.category_to_models.items():
                last_model = next(reversed(model_id_to_model))
                new_data_infer_thread_pool.submit(infer_missing_elements,workspace_id,category,dataset_name, last_model)
                total_infer_jobs += 1
    logging.info(f"{total_infer_jobs} infer jobs were submitted in the background")
    return loaded, workspaces_to_update



def infer_missing_elements(workspace_id, category, dataset_name, model_id):
    model_status = get_model_status(workspace_id,model_id)
    if (model_status == ModelStatus.ERROR):
        logging.error(
            f"cannot run inference with the last model for category {category} in workspace "
            f"{workspace_id} after new documents were loaded to dataset {dataset_name} using model {model_id} as the model status is ERROR")
        return
    start_time = time.time()
    while (model_status!=ModelStatus.READY):
        wait_time = time.time() - start_time
        if wait_time>15 * 60:
            logging.error(f"timeout reached when waiting to run inference with the last model for category {category} in workspace "
                 f"{workspace_id} after new documents were loaded to dataset {dataset_name} using model {model_id}")
            return
        logging.info(f"waiting for model {model_id} training to complete in order to infer newly added documents")
        time.sleep(30)
        model_status = get_model_status(workspace_id, model_id)

    logging.info(f"running inference with the last model for category {category} in workspace "
                 f"{workspace_id} after new documents were loaded to dataset {dataset_name} using model {model_id}")
    infer(workspace_id,category,get_all_text_elements(dataset_name),model_id)
    logging.info(f"completed inference with the last model for category {category} in workspace "
                 f"{workspace_id} after new documents were loaded to dataset {dataset_name} using model {model_id}")


def get_suspicious_report(workspace_id, category_name) -> List[TextElement]:
    return orchestrator_api.get_suspicious_elements_report(workspace_id, category_name)


def get_contradictions_report_with_diffs(workspace_id, category_name) -> List[Tuple[TextElement]]:
    return orchestrator_api.get_contradictions_report_with_diffs(workspace_id, category_name)



if __name__ == '__main__':
    # orchestrator_api.delete_workspace("Warranties_cnc_in_domain_Warranties_NB")
    # orchestrator_api.delete_workspace("Warranties_cnc_in_domain_Warranties_NB_RETROSPECTIVE_iter_1")
    # orchestrator_api.delete_workspace("Warranties_cnc_in_domain_Warranties_NB_RETROSPECTIVE_iter_2")
    # orchestrator_api.delete_workspace("Warranties_cnc_in_domain_Warranties_NB_RETROSPECTIVE_iter_3")
    # orchestrator_api.delete_workspace("Warranties_cnc_in_domain_Warranties_NB_RETROSPECTIVE_iter_4")
    # orchestrator_api.delete_workspace("Warranties_cnc_in_domain_Warranties_NB_RETROSPECTIVE_iter_5")
    def print_document_by_id_print_text_element_by_id():
        workspace_id = "my_first_workspace"
        #dataset_name = "cnc_in_domain_train"
        dataset_name = "isear_train"
        #category_name = "Safety and Security"
        #if workspace_exists(workspace_id):
        #    delete_workspace(workspace_id)
        # print(get_disagreements_between_labels_and_model(workspace_id, 'fear'))
        # print(get_suspected_labeling_contradictions_by_distance(workspace_id, 'fear'))
        # create a new workspace and with category named "fear" using preloaded dataset
        #create_workspace(workspace_id=workspace_id, dataset_name=dataset_name)
        #create_new_category(workspace_id, category_name, "description")

        #documents = get_documents(workspace_id,dataset_name,["cnc_in_domain_train/0"]) # get a specific document by id
        #print(documents[0])  # Document(uri='cnc_in_domain_train/0', text_elements=[TextElement(uri='cnc_in_domain_train/0/0', text='This Base Agreement ("Base Agreement") bet....
        #element_uri = documents[0].text_elements[0].uri
        #text_elements = get_text_elements(workspace_id, dataset_name, [element_uri])
        text_elements = get_text_elements(workspace_id, dataset_name, ['cnc_in_domain_train/0/0'])
        print(text_elements[0]) # TextElement(uri='cnc_in_domain_train/0/0', text='This Base Agreement ("Base Agreement") between IBM("Buyer") and CIC Plus ("Supplier"), establishes the basis for a procurement relationship under which Supplier will provide the Deliverables and Services described in SOWs and/or WAs issued under this Base Agreement.', span=[(254, 1117)], metadata=None, category_to_label='{}')

        ####### one time run to make bidirectional dictionary ######
        # elements = get_all_text_elements(dataset_name)
        # d={}
        # for e in elements:
        #     d[e.uri] = str(uuid.uuid4())
        # d.update( dict((d[k], k) for k in d) )
        # j = json.dumps(d)
        # f = open(dataset_name+".json","w")
        # f.write(j)
        # f.close()
        ####### end one time run to make bidirectional dictionary ######


    def end_to_end_example():
        workspace_id = "my_first_workspace"
        dataset_name = "isear_train"
        category_name = "fear"
        dataset_name = "cnc_in_domain_train"
        category_name = "warranty"
        if workspace_exists(workspace_id):
            delete_workspace(workspace_id)

        # create a new workspace and with category named "fear" using preloaded dataset
        create_workspace(workspace_id=workspace_id,dataset_name=dataset_name)
        create_new_category(workspace_id,category_name,"sentences expressing fear")

        # query for 100 sentences containing the word "fear"
        query_results = query(workspace_id,dataset_name,category_name,"warrant",unlabeled_only=True,sample_size=100)["results"]

        #set positives labels for all the queries sentences ("user's labels")
        uri_with_positive_label = [(x.uri, {category_name: Label("true",{})}) for x in query_results[:-2]]
        uri_with_negative_label = [(x.uri, {category_name: Label("false",{})}) for x in query_results[-2:]]
        print(uri_with_positive_label)
        set_labels(workspace_id,uri_with_positive_label+uri_with_negative_label)

        # print the label counts (100 positive labels with no negative labels)
        logging.info(get_label_counts(workspace_id, dataset_name, category_name))

        # train a new model using the above 100 samples (and random sentences as negatives)
        train_if_recommended(workspace_id,category_name)

        # get 10 random sentences from the dataset and predict their label
        sample = get_all_text_elements(dataset_name)[0:10]
        predicted_label = infer(workspace_id,category_name,sample)["labels"]

        for text_element,prediction in zip(sample,predicted_label):
            logging.info(f"Prediction:{prediction}:::{text_element.text}")

        #TBD...
        items_to_label = get_elements_to_label(workspace_id,category_name,20)
        print(items_to_label)


def sample_elements_by_prediction(workspace_id, category, size, unlabeled_only=False, required_label=LABEL_POSITIVE,
                                  random_state: int = 0):
    orchestrator_api.sample_elements_by_prediction(**locals())
    # print_document_by_id_print_text_element_by_id()
    # end_to_end_example()