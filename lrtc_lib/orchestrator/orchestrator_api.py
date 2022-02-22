import logging
import sys
import time
from collections import Counter, defaultdict, OrderedDict
from concurrent.futures.thread import ThreadPoolExecutor
from datetime import datetime
from typing import Mapping, List, Sequence, Tuple

import pandas as pd

import lrtc_lib.data_access.data_access_factory as data_access_factory
from lrtc_lib.analysis_utils.labeling_reports import  \
    get_suspected_labeling_contradictions_by_distance_with_diffs, get_disagreements_using_cross_validation
from lrtc_lib.config import CONFIGURATION
from lrtc_lib.data_access.core.data_structs import DisplayFields, Document, Label, TextElement, LABEL_POSITIVE
from lrtc_lib.data_access.label_import_utils import process_labels_dataframe
from lrtc_lib.data_access.processors.csv_processor import CsvFileProcessor
from lrtc_lib.definitions import ACTIVE_LEARNING_FACTORY, MODEL_FACTORY
from lrtc_lib.models.core.model_api import ModelStatus, Prediction
from lrtc_lib.models.core.model_types import ModelTypes
from lrtc_lib.orchestrator.core.state_api import orchestrator_state_api
from lrtc_lib.orchestrator.core.state_api.orchestrator_state_api import ModelInfo, IterationStatus, Category
from lrtc_lib.orchestrator.utils import _convert_text_elements_to_train_data
from lrtc_lib.training_set_selector.training_set_selector_factory import get_training_set_selector


# constants
MAX_VALUE = 1000000
NUMBER_OF_MODELS_TO_KEEP = 2
TRAIN_COUNTS_STR_KEY = "train_counts"


# members
data_access = data_access_factory.get_data_access()
new_data_infer_thread_pool = ThreadPoolExecutor(1)


def create_workspace(workspace_id: str, dataset_name: str):
    """
    create a new workspace
    :param workspace_id:
    :param dataset_name:
    """
    orchestrator_state_api.create_workspace(workspace_id, dataset_name)
    logging.info(f"Creating workspace {workspace_id} using dataset {dataset_name}")


def create_new_category(workspace_id: str, category_name: str, category_description: str):
    """
    declare a new category in the given workspace
    :param workspace_id:
    :param category_name:
    :param category_description:
    """
    orchestrator_state_api.add_category_to_workspace(workspace_id, category_name, category_description)


def delete_workspace(workspace_id: str):
    """
    delete a given workspace
    :param workspace_id:
    """
    logging.info(f"deleting workspace {workspace_id}")
    if workspace_exists(workspace_id):
        workspace = orchestrator_state_api.get_workspace(workspace_id)
        try:
            for category_name in workspace.categories.keys():
                delete_category_models(workspace_id, category_name)
            orchestrator_state_api.delete_workspace_state(workspace_id)
        except Exception as e:
            logging.exception(f"error deleting workspace {workspace_id}")
            raise e
        try:
            data_access.delete_all_labels(workspace_id, workspace.dataset_name)
        except Exception as e:
            logging.exception(f"error clearing saved labels for workspace {workspace_id}")
            raise e


def delete_category_models(workspace_id, category_name):
    workspace = orchestrator_state_api.get_workspace(workspace_id)
    for idx in range(len(workspace.categories[category_name].active_learning_iterations)):
        delete_model(workspace_id, category_name, idx)


def delete_category(workspace_id: str, category_name: str):
    delete_category_models(workspace_id, category_name)
    orchestrator_state_api.delete_category_from_workspace(workspace_id, category_name)


def query(workspace_id: str, dataset_name: str, category_name: str, query_regex: str, sample_size: int = sys.maxsize,
          sample_start_idx: int = 0, unlabeled_only: bool = False, remove_duplicates=False) -> Mapping[str, object]:
    """
    query a dataset using the given regex, returning up to *sample_size* elements that meet the query

    :param workspace_id:
    :param dataset_name:
    :param category_name:
    :param query_regex: string
    :param unlabeled_only: if True, filters out labeled elements
    :param sample_size: maximum items to return
    :param sample_start_idx: get elements starting from this index (for paging)
    :param remove_duplicates: if True, remove duplicate elements
    :return: a dictionary with two keys: 'results' whose value is a list of TextElements, and 'hit_count' whose
    value is the total number of TextElements in the dataset matched by the query.
    {'results': [TextElement], 'hit_count': int}
    """

    if unlabeled_only:
        return data_access.get_unlabeled_text_elements(workspace_id=workspace_id, dataset_name=dataset_name,
                                                          category_name=category_name, sample_size=sample_size,
                                                          sample_start_idx=sample_start_idx,
                                                          remove_duplicates=remove_duplicates)
    else:
        return data_access.get_text_elements(workspace_id=workspace_id, dataset_name=dataset_name,
                                                sample_size=sample_size, sample_start_idx=sample_start_idx,
                                                query_regex=query_regex, remove_duplicates=remove_duplicates)


def get_documents(workspace_id: str, dataset_name: str, uris: Sequence[str]) -> List[Document]:
    """
    :rtype: list of Document
    :param workspace_id:
    :param dataset_name:
    :param uris:
    """
    return data_access.get_documents(workspace_id, dataset_name, uris)


def get_text_elements_by_uris(workspace_id: str, dataset_name: str, uris: Sequence[str]) -> List[TextElement]:
    """
    :param workspace_id:
    :param dataset_name:
    :param uris:
    """
    return data_access.get_text_elements_by_uris(workspace_id, dataset_name, uris)


def _update_recommendation(workspace_id, dataset_name, category_name, count, iteration_index: int):
    """
    Using the AL strategy, update the workspace with next recommended elements for labeling
    :param workspace_id:
    :param dataset_name:
    :param category_name:
    :param count:
    :param iteration_index: iteration to use
    """

    # orchestrator_state_api.update_iteration_status(workspace_id, category_name, iteration_index,
    #                                                IterationStatus.RUNNING_ACTIVE_LEARNING)
    active_learner = ACTIVE_LEARNING_FACTORY.get_active_learner(CONFIGURATION.active_learning_strategy)
    unlabeled = data_access.get_unlabeled_text_elements(workspace_id, dataset_name, category_name,
                                                        remove_duplicates=True)["results"]
    predictions = infer(workspace_id, category_name, unlabeled)
    new_recommendations = active_learner.get_recommended_items_for_labeling(workspace_id=workspace_id,
                                                                            dataset_name=dataset_name,
                                                                            category_name=category_name,
                                                                            candidate_text_elements=unlabeled,
                                                                            candidate_text_element_predictions=predictions,
                                                                            sample_size=count)
    orchestrator_state_api.update_category_recommendations(workspace_id=workspace_id, category_name=category_name,
                                                           iteration_index=iteration_index,
                                                           recommended_items=[x.uri for x in new_recommendations])

    logging.info(f"active learning suggestions for iteration index {iteration_index} of category {category_name} are ready")

    # orchestrator_state_api.update_active_learning_status(workspace_id, category_name, iteration_index,
    #                                                      IterationStatus.DONE_ACTIVE_LEARNING?)


def get_iteration_status(workspace_id, category_name, iteration_index):
    return orchestrator_state_api.get_iteration_status(workspace_id, category_name, iteration_index)


def get_elements_to_label(workspace_id: str, category_name: str, count: int, start_index: int = 0) -> Sequence[TextElement]:
    """
    returns a list of the top *count* elements recommended for labeling by the AL strategy.
    The active learner is invoked only if the requested count of elements have not yet been added to the workspace.
    :param workspace_id:
    :param category_name:
    :param count:
    :param start_index:
    """
    # TODO check for latest model in AL results ready?

    recommended_uris = orchestrator_state_api.get_current_category_recommendations(workspace_id, category_name)

    if start_index > len(recommended_uris):
        raise Exception(f"exceeded max recommended items. last element index is {len(recommended_uris) - 1}")
    recommended_uris = recommended_uris[start_index:start_index + count]
    dataset_name = get_dataset_name(workspace_id)
    return get_text_elements_by_uris(workspace_id, dataset_name, recommended_uris)


def set_labels(workspace_id: str, uri_to_label: Mapping[str, Mapping[str, Label]], apply_to_duplicate_texts=True,
               update_label_counter=True):
    """
    set labels for URIs.
    :param workspace_id:
    :param uri_to_label: Maps URIs to a dict in the format of {"category_name": Label},
    where Label is an instance of data_structs.Label
    :param apply_to_duplicate_texts: if True, also set the same labels for additional URIs that are duplicates of
    the URIs provided.
    :param update_label_counter:
    """
    if update_label_counter:
        # count the number of labels for each category
        changes_per_cat = Counter([cat for uri, labels_dict in uri_to_label.items() for cat in labels_dict])
        for cat, num_changes in changes_per_cat.items():
            orchestrator_state_api.increase_label_change_count_since_last_train(workspace_id, cat, num_changes)
    data_access.set_labels(workspace_id, uri_to_label, apply_to_duplicate_texts)


def unset_labels(workspace_id: str, category_name, uris: Sequence[str], apply_to_duplicate_texts=True):
    """
    unset labels of a given category for URIs.
    :param workspace_id:
    :param category_name:
    :param uris:
    :param apply_to_duplicate_texts: if True, also unset the same labels for additional URIs that are duplicates of
    the URIs provided.
    """
    data_access.unset_labels(workspace_id, category_name, uris, apply_to_duplicate_texts=apply_to_duplicate_texts)

# TODO refactor data access and use better names for each method

def get_all_labeled_text_elements(workspace_id, dataset_name, category) -> Mapping:
    return data_access.get_labeled_text_elements(workspace_id, dataset_name, category, 10 ** 6,
                                                    remove_duplicates=False)

 
def get_text_elements(workspace_id, dataset_name, sample_size=sys.maxsize, random_state: int = 0) -> Mapping:
    return data_access.get_text_elements(workspace_id, dataset_name, sample_size, remove_duplicates=False,
                                            random_state=random_state)


def get_unlabeled_text_elements(workspace_id, dataset_name, category, sample_size=sys.maxsize, random_state: int = 0) -> Mapping:
    return data_access.get_unlabeled_text_elements(workspace_id, dataset_name, category, sample_size,
                                                      remove_duplicates=False, random_state=random_state)


def train(workspace_id: str, category_name: str, model_type: ModelTypes, train_data, train_params=None):
    """
    train a model for a category in the specified workspace
    :param workspace_id:
    :param category_name:
    :param model_type:
    :param train_data:
    :param train_params:
    :return: model_id
    """
    def _get_counts_per_label(text_elements):
        """
        reflect the more detailed description of training labels, e.g. how many of the elements have weak labels
        """
        label_names = [element.category_to_label[category_name].get_detailed_label_name()
                       for element in text_elements]

        return dict(Counter(label_names))

    model_metadata = dict()
    train_counts = _get_counts_per_label(train_data)
    model_metadata[TRAIN_COUNTS_STR_KEY] = train_counts

    logging.info(
        f"workspace {workspace_id} training a model for category '{category_name}', model_metadata: {model_metadata}")
    train_data = _convert_text_elements_to_train_data(train_data, category_name)

    model = MODEL_FACTORY.get_model(model_type)
    logging.info(f'start training using {len(train_data)} items')
    model_id = model.train(train_data=train_data, train_params=train_params)
    logging.info(f"new model id is {model_id}")

    model_status = model.get_model_status(model_id)
    if train_params:
        model_metadata = {**model_metadata, **train_params}
    model_info = ModelInfo(model_id=model_id, model_status=model_status, model_type=model_type,
                           model_metadata=model_metadata, creation_date=datetime.now())
    orchestrator_state_api.add_iteration(workspace_id=workspace_id, category_name=category_name, model_info=model_info)
    return model_id


def get_all_iterations_for_category(workspace_id, category_name: str):
    """
    :param workspace_id:
    :param category_name:
    :return: dict from model_id to ModelInfo
    """
    return orchestrator_state_api.get_all_iterations(workspace_id, category_name)


def infer(workspace_id: str, category_name: str, elements_to_infer: Sequence[TextElement], iteration_index: int = None,
          use_cache: bool = True) -> Sequence[Prediction]:
    """
    get the prediction for a list of TextElements
    :param workspace_id:
    :param category_name:
    :param elements_to_infer: list of TextElements
    :param iteration_index: iteration to use. If set to None, the latest model for the category will be used #TODO do we want to keep it?
    :param use_cache: utilize a cache that stores inference results
    :return: a list of Prediction objects
    """
    if len(elements_to_infer) == 0:
        return []

    if iteration_index is None:  # use latest
        # iteration = orchestrator_state_api.get_latest_iteration_by_status(workspace_id=workspace_id,
        #                                                                   category_name=category_name,
        #                                                                   iteration_status=IterationStatus.READY)
        iterations = orchestrator_state_api.get_all_iterations(workspace_id, category_name)
        iteration = [it for it in iterations if it.model.model_status == ModelStatus.READY][-1]

    else:
        iterations = get_all_iterations_for_category(workspace_id, category_name)
        iteration = iterations[iteration_index]

        # if iteration.status != IterationStatus.READY:
        #     raise Exception(f"iteration {iteration_index} in workspace {workspace_id} category {category_name} is not "
        #                     f"in status {IterationStatus.READY}. (current status is {iteration.status})")
        if iteration.model.model_status != ModelStatus.READY:
            raise Exception(f"model for iteration {iteration_index} in workspace {workspace_id} category {category_name}"
                            f" is not ready. (current status is {iteration.model.model_status})")

    model_info = iteration.model
    if model_info.model_status != ModelStatus.READY:
        raise Exception(f"model id {model_info.model_id} is not in READY status while iteration status is "
                        f"{iteration.status}.  Something went wrong")
    model = MODEL_FACTORY.get_model(model_info.model_type)
    list_of_dicts = [{"text": element.text} for element in elements_to_infer]
    predictions = model.infer(model_id=model_info.model_id, items_to_infer=list_of_dicts, use_cache=use_cache)

    return predictions


def get_all_text_elements(dataset_name: str) -> List[TextElement]:
    """
    get all the text elements of the given dataset
    :param dataset_name:
    """
    return data_access.get_all_text_elements(dataset_name=dataset_name)


def get_all_document_uris(workspace_id):
    dataset_name = get_dataset_name(workspace_id)
    return data_access.get_all_document_uris(dataset_name)


def get_label_counts(workspace_id: str, dataset_name: str, category_name: str, remove_duplicates=False):
    """
    get the number of elements that were labeled.
    :param workspace_id:
    :param dataset_name:
    :param category_name:
    :param remove_duplicates: whether to count all labeled elements or only unique instances
    :return:
    """
    return data_access.get_label_counts(workspace_id, dataset_name, category_name, remove_duplicates=remove_duplicates)


def delete_model(workspace_id, category_name, iteration_index):
    iteration = get_all_iterations_for_category(workspace_id, category_name)[iteration_index]
    model_info = iteration.model
    if model_info.model_status == ModelStatus.DELETED:
        raise Exception(f"trying to delete model id {model_info.model_id} which is already in {ModelStatus.DELETED}"
                        f"from workspace {workspace_id} in category {category_name}")

    train_and_infer = MODEL_FACTORY.get_model(model_info.model_type)
    logging.info(f"marking iteration {iteration_index} model id {model_info.model_id} from workspace {workspace_id} in category {category_name} as deleted,"
                 f" and deleting the model")
    orchestrator_state_api.mark_iteration_model_as_deleted(workspace_id, category_name, iteration_index)
    train_and_infer.delete_model(model_info.model_id)


def workspace_exists(workspace_id: str) -> bool:
    return orchestrator_state_api.workspace_exists(workspace_id)


def get_dataset_name(workspace_id: str) -> str:
    return orchestrator_state_api.get_workspace(workspace_id).dataset_name


def get_contradiction_report(workspace_id, category_name) -> List[Tuple[TextElement]]:
    dataset_name = get_dataset_name(workspace_id)
    labeled_elements = get_all_labeled_text_elements(workspace_id, dataset_name, category_name)["results"]
    return get_suspected_labeling_contradictions_by_distance_with_diffs(labeled_elements, category_name)


def get_suspicious_elements_report(workspace_id, category_name, model_type: ModelTypes = ModelTypes.SVM_ENSEMBLE) \
        -> List[TextElement]:
    dataset_name = get_dataset_name(workspace_id)
    return get_disagreements_using_cross_validation(workspace_id, dataset_name, category_name, model_type)


def sample_elements_by_prediction(workspace_id, category, sample_size: int = sys.maxsize, unlabeled_only=False,
                                  required_label=LABEL_POSITIVE, random_state: int = 0):
    dataset_name = get_dataset_name(workspace_id)
    if unlabeled_only:
        elements = \
            get_unlabeled_text_elements(workspace_id, dataset_name, category, random_state=random_state)["results"]
    else:
        elements = get_text_elements(workspace_id, dataset_name, random_state=random_state)["results"]
    predictions = infer(workspace_id, category, elements)
    prediction_sample = \
        [text_element for text_element, prediction in zip(elements, predictions) if prediction.label == required_label]

    return prediction_sample[:sample_size]


def estimate_precision(workspace_id, category, ids, changed_elements_count, iteration_index):
    dataset_name = get_dataset_name(workspace_id)
    text_elements = get_text_elements_by_uris(workspace_id, dataset_name, ids)
    positive_elements = [te for te in text_elements if te.category_to_label[category].label == LABEL_POSITIVE]

    estimated_precision = len(positive_elements)/len(text_elements)
    orchestrator_state_api.add_iteration_statistics(workspace_id, category, iteration_index,
                                                    {"estimated_precision": estimated_precision,
                                                     "estimated_precision_num_elements": len(ids)})

    # since we don't want a new model to train while labeling in precision evaluation mode, we only update the
    # labeling counts after evaluation is finished
    orchestrator_state_api.increase_label_change_count_since_last_train(workspace_id, category, changed_elements_count)
    return estimated_precision


def get_progress(workspace_id: str, dataset_name: str, category: str):
    category_label_counts = get_label_counts(workspace_id, dataset_name, category)
    if category_label_counts[LABEL_POSITIVE]:
        changed_since_last_model_count = orchestrator_state_api.get_label_change_count_since_last_train(workspace_id, category)

        return {"all": min(
            max(0, min(round(changed_since_last_model_count / CONFIGURATION.changed_element_threshold * 100), 100)),
            max(0, min(round(category_label_counts[LABEL_POSITIVE] / CONFIGURATION.first_model_positive_threshold * 100), 100))
        )
        }
    else:
        return {"all": 0}


def list_workspaces():
    return sorted([x.workspace_id for x in orchestrator_state_api.get_all_workspaces()])


def get_all_dataset_names():
    return sorted(data_access.get_all_dataset_names())


def get_all_categories(workspace_id: str) -> Mapping[str, Category]:
    return orchestrator_state_api.get_workspace(workspace_id).categories


def get_all_iterations_by_status(workspace_id, category_name, iteration_status: IterationStatus):
    return orchestrator_state_api.get_all_iterations_by_status(workspace_id, category_name, iteration_status)


def _post_train_method(workspace_id, category_name, iteration_index): #TODO refactor
    dataset_name = get_dataset_name(workspace_id)
    elements = get_all_text_elements(dataset_name)
    predictions = infer(workspace_id, category_name, elements, iteration_index)
    dataset_size = len(predictions)
    positive_fraction = sum([pred.label==True for pred in predictions])/dataset_size
    post_train_statistics = {"positive_fraction": positive_fraction}

    previous_iterations = orchestrator_state_api.get_all_iterations(workspace_id, category_name)[:iteration_index]
    previous_ready_iteration_indices = [candidate_iteration_index for candidate_iteration_index, iteration
                                        in enumerate(previous_iterations) if iteration.status == IterationStatus.READY]
    if len(previous_ready_iteration_indices) > 0:
        previous_model_predictions = infer(workspace_id, category_name, elements,
                                           iteration_index=previous_ready_iteration_indices[-1])
        num_identical = sum(x.label == y.label for x, y in zip(predictions, previous_model_predictions))
        post_train_statistics["changed_fraction"] = (dataset_size-num_identical)/dataset_size

    logging.info(f"post train measurements for iteration {iteration_index}: {post_train_statistics}")
    orchestrator_state_api.add_iteration_statistics(workspace_id, category_name, iteration_index, post_train_statistics)


def _post_active_learning_func(workspace_id, category_name, iteration_index): #TODO refactor

    previous_iterations = orchestrator_state_api.get_all_iterations(workspace_id, category_name)[:iteration_index]
    previous_ready_iteration_indices = [candidate_iteration_index for candidate_iteration_index, iteration
                                        in enumerate(previous_iterations) if iteration.status == IterationStatus.READY]

    for candidate_iteration_index in previous_ready_iteration_indices[:-NUMBER_OF_MODELS_TO_KEEP]:
        logging.info(f"keep only {NUMBER_OF_MODELS_TO_KEEP} models, deleting iteration {candidate_iteration_index}")
        delete_model(workspace_id, category_name, candidate_iteration_index)


def import_category_labels(workspace_id, labels_df_to_import: pd.DataFrame):
    logging.info(f"Importing {len(labels_df_to_import)} unique labeled elements into workspace '{workspace_id}' from"
                 f" {len(labels_df_to_import[DisplayFields.category_name].unique())} categories")
    dataset_name = get_dataset_name(workspace_id)
    imported_categories_to_uris_and_labels = process_labels_dataframe(workspace_id, dataset_name, labels_df_to_import)

    existing_categories = get_all_categories(workspace_id)
    categories_counter = defaultdict(int)
    categories_created = []
    lines_skipped = []
    for category_name, uri_to_label in imported_categories_to_uris_and_labels.items():
        if category_name not in existing_categories:
            logging.info(f"** category '{category_name}' is missing, creating it ** ")
            create_new_category(workspace_id, category_name, f'{category_name} (created during upload)')
            categories_created.append(category_name)

        logging.info(f'{category_name}: adding labels for {len(uri_to_label)} uris')
        #TODO something with the structure doesn't make sense - it is category to uri to category to label
        set_labels(workspace_id, uri_to_label,
                   apply_to_duplicate_texts=CONFIGURATION.apply_labels_to_duplicate_texts,
                   update_label_counter=True)

        label_counts_dict = get_label_counts(workspace_id, dataset_name, category_name, False)
        logging.info(f"Updated total label count in workspace '{workspace_id}' for category {category_name} "
                     f"is {sum(label_counts_dict.values())} ({label_counts_dict})")
        categories_counter[category_name] = len(uri_to_label)
    # TODO return both positive and negative counts
    categories_counter_list = [{'category': key, 'counter': value} for key, value in categories_counter.items()]
    total = sum(categories_counter.values())

    res = {'categories': categories_counter_list,
           'categoriesCreated': categories_created,
           'linesSkipped': lines_skipped,
           'total': total}
    return res


def export_workspace_labels(workspace_id) -> pd.DataFrame:
    dataset_name = get_dataset_name(workspace_id)
    categories = get_all_categories(workspace_id)
    list_of_dicts = []
    for category in categories:
        label_count = sum(get_label_counts(workspace_id, dataset_name, category, False).values())
        logging.info(f"Total label count in workspace '{workspace_id}' is {label_count}")
        labeled_elements = data_access.get_labeled_text_elements(workspace_id, dataset_name, category,
                                                                    remove_duplicates=False)['results']
        logging.info(f"Exporting {len(labeled_elements)} unique labeled elements for category '{category}'"
                     f" from workspace '{workspace_id}'")
        list_of_dicts.extend(
            [{DisplayFields.workspace_id: workspace_id,
              DisplayFields.category_name: category,
              DisplayFields.doc_id: le.uri.split('-')[1],  # TODO handle when handling uri/doc_id/element_id
              DisplayFields.dataset: dataset_name,
              DisplayFields.text: le.text,
              DisplayFields.uri: le.uri,
              DisplayFields.element_metadata: le.metadata,
              DisplayFields.label: le.category_to_label[category].label,
              DisplayFields.label_metadata: le.category_to_label[category].metadata,
              DisplayFields.label_type: le.category_to_label[category].label_type.name}
             for le in labeled_elements])
    return pd.DataFrame(list_of_dicts)


def export_model(workspace_id, category_name, iteration_index):
    iteration = orchestrator_state_api.get_all_iterations(workspace_id, category_name)[iteration_index]

    train_and_infer = MODEL_FACTORY.get_model(iteration.model.model_type)
    exported_model_dir = train_and_infer.export_model(iteration.model.model_id)
    return exported_model_dir


def add_documents_from_file(dataset_name, temp_filename):
    global new_data_infer_thread_pool
    logging.info(f"adding documents to dataset {dataset_name}")
    documents = CsvFileProcessor(dataset_name, temp_filename).build_documents()
    document_statistics = data_access.add_documents(dataset_name, documents)
    workspaces_to_update = []
    total_infer_jobs = 0
    for workspace_id in list_workspaces():
        workspace = orchestrator_state_api.get_workspace(workspace_id)
        if workspace.dataset_name == dataset_name:
            workspaces_to_update.append(workspace_id)

            for category_name, category in workspace.categories.items():
                if CONFIGURATION.apply_labels_to_duplicate_texts:
                    # since new data may contain texts identical to existing labeled texts, we set all the existing
                    # labels again to apply the labels to the new data
                    labeled_elements = data_access.get_labeled_text_elements(workspace_id, dataset_name, category_name)['results']
                    uri_to_label = {te.uri: te.category_to_label for te in labeled_elements}
                    data_access.set_labels(workspace_id, uri_to_label, apply_to_duplicate_texts=True)

                if len(category.active_learning_iterations) > 0:
                    iteration_index = len(category.active_learning_iterations)-1
                    new_data_infer_thread_pool.submit(infer_missing_elements, workspace_id, category, dataset_name, iteration_index)
                    total_infer_jobs += 1
    logging.info(f"done adding documents to {dataset_name} upload statistics: {document_statistics}. {total_infer_jobs} infer jobs were submitted in the background")
    return document_statistics, workspaces_to_update


def infer_missing_elements(workspace_id, category, dataset_name, iteration_index):
    iteration_status = get_iteration_status(workspace_id, category, iteration_index)
    if iteration_status == IterationStatus.ERROR:
        logging.error(
            f"cannot run inference for category {category} in workspace {workspace_id} after new documents were loaded "
            f"to dataset {dataset_name} using model {iteration_index}, as the iteration status is ERROR")
        return
    # if *model_id* is currently training, wait for training to complete
    start_time = time.time()
    while iteration_status != IterationStatus.READY:
        wait_time = time.time() - start_time
        if wait_time > 15 * 60:
            logging.error(f"timeout reached when waiting to run inference with the last model "
                          f"for category {category} in workspace {workspace_id} after new documents were loaded "
                          f"to dataset {dataset_name} using model {iteration_index}")
            return
        logging.info(f"waiting for iteration {iteration_index} to complete in order to infer newly added documents"
                     f" for category {category} in workspace {workspace_id}")
        time.sleep(30)
        iteration_status = get_iteration_status(workspace_id, category, iteration_index)

    logging.info(f"running inference with the last model for category {category} in workspace "
                 f"{workspace_id} after new documents were loaded to dataset {dataset_name} using model {iteration_index}")
    # Currently there is no indication to the user that inference is running on the new documents, and there is no
    # indication for when this inferences ends. Can be added and reflected in the UI in the future
    infer(workspace_id, category, get_all_text_elements(dataset_name), iteration_index)
    logging.info(f"completed inference with the last model for category {category} in workspace "
                 f"{workspace_id} after new documents were loaded to dataset {dataset_name} using model {iteration_index}")


def train_if_recommended(workspace_id: str, category_name: str, force=False):
    try:
        workspace = orchestrator_state_api.get_workspace(workspace_id)
        dataset_name = workspace.dataset_name

        iterations = workspace.categories[category_name].active_learning_iterations
        iterations_without_errors = [iteration for iteration in iterations if iteration.status != IterationStatus.ERROR]

        label_counts = data_access.get_label_counts(workspace_id=workspace_id, dataset_name=dataset_name,
                                                    category_name=category_name, remove_duplicates=True)
        changes_since_last_model = orchestrator_state_api.get_label_change_count_since_last_train(workspace_id, category_name)

        if force or (LABEL_POSITIVE in label_counts
                     and label_counts[LABEL_POSITIVE] >= CONFIGURATION.first_model_positive_threshold
                     and changes_since_last_model >= CONFIGURATION.changed_element_threshold):
            if len(iterations_without_errors) > 0 and iterations_without_errors[-1].status != IterationStatus.READY:
                logging.info(f"workspace {workspace_id} category {category_name} new elements criterion met but previous AL not yet ready, not initiating a new training")
                return None
            orchestrator_state_api.set_label_change_count_since_last_train(workspace_id, category_name, 0)
            logging.info(
                f"{label_counts[LABEL_POSITIVE]} positive elements (>={CONFIGURATION.first_model_positive_threshold})"
                f" {changes_since_last_model} elements changed since last model (>={CONFIGURATION.changed_element_threshold})"
                f" training a new model")
            iteration_num = len(iterations_without_errors)
            model_type = CONFIGURATION.model_policy.get_model(iteration_num)
            train_set_selector = get_training_set_selector(selector=CONFIGURATION.training_set_selection_strategy)
            train_data = train_set_selector.get_train_set(
                workspace_id=workspace_id, train_dataset_name=dataset_name,
                category_name=category_name)
            model_id = train(workspace_id=workspace_id, category_name=category_name, model_type=model_type,
                             train_data=train_data)
            return model_id
        else:
            logging.info(f"{label_counts[LABEL_POSITIVE]} positive elements (should be >={CONFIGURATION.first_model_positive_threshold}) AND"
                         f" {changes_since_last_model} elements changed since last model (should be >={CONFIGURATION.changed_element_threshold})"
                         f" not training a new model")
            return None
    except Exception:
        logging.exception("train_if_recommended failed in a background thread. Model will not be trained")
