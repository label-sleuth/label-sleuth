# (c) Copyright IBM Corporation 2020.

# LICENSE: Apache License 2.0 (Apache-2.0)
# http://www.apache.org/licenses/LICENSE-2.0

import glob
import logging
import os
import traceback
import numpy as np
from collections import Counter
from enum import Enum
from typing import Mapping, List, Sequence, Tuple, Set

from sklearn.preprocessing import MultiLabelBinarizer

import lrtc_lib.data_access.data_access_factory as data_access_factory
from lrtc_lib.active_learning.strategies import ActiveLearningStrategy
from lrtc_lib.analysis_utils.analyze_tokens import ngrams_by_info_gain
from lrtc_lib.analysis_utils.labeling_reports import  \
    get_suspected_labeling_contradictions_by_distance_with_diffs, get_disagreements_using_cross_validation
from lrtc_lib.data_access.core.data_structs import Document, Label, TextElement, BINARY_LABELS, LABEL_POSITIVE
from lrtc_lib.data_access.core.utils import get_workspace_labels_dump_filename
from lrtc_lib.definitions import PROJECT_PROPERTIES
from lrtc_lib.models.core.model_api import ModelStatus
from lrtc_lib.models.core.model_type import ModelType, ModelTypes
from lrtc_lib.orchestrator.core.state_api import orchestrator_state_api
from lrtc_lib.orchestrator.core.state_api.orchestrator_state_api import ModelInfo, ActiveLearningRecommendationsStatus
from lrtc_lib.orchestrator.utils import _convert_to_dicts_with_numeric_labels


# constants

MAX_VALUE = 1000000

TRAIN_COUNTS_STR_KEY = "train_counts"
DEV_COUNTS_STR_KEY = "dev_counts"



# members

active_learning_strategy = PROJECT_PROPERTIES["active_learning_strategy"]
active_learner = PROJECT_PROPERTIES["active_learning_factory"].get_active_learner(active_learning_strategy)

data_access = data_access_factory.get_data_access()


def _delete_orphan_labels():
    """
    delete labels that are not attached to a known workspace
    """
    all_label_dump_files = glob.glob(get_workspace_labels_dump_filename(workspace_id='*', dataset_name='*'))
    existing_workspace_ids = [w.workspace_id for w in orchestrator_state_api.get_all_workspaces()]
    dump_files_with_parents = [file for wid in existing_workspace_ids for file in
                               glob.glob(get_workspace_labels_dump_filename(workspace_id=wid, dataset_name='*'))]
    for dump_file in all_label_dump_files:
        if dump_file not in dump_files_with_parents:
            logging.info(f"deleting orphan labels file {dump_file}")
            os.remove(dump_file)

def copy_workspace(existing_workspace_id: str, new_workspace_id: str):
    """
    Creates a copy of a given workspace with its labels under a new workspace id
    :param existing_workspace_id:
    :param new_workspace_id:
    :return:
    """
    workspace = get_workspace(existing_workspace_id)
    dataset_name = workspace.dataset_name
    dev_dataset_name = workspace.dev_dataset_name
    data_access.copy_labels_to_new_workspace(existing_workspace_id, new_workspace_id, dataset_name, dev_dataset_name)
    orchestrator_state_api.copy_workspace(existing_workspace_id, new_workspace_id)
    return new_workspace_id


def set_active_learning_strategy(new_active_learning_strategy=None):
    """
    Set active learning policy to use
    :param new_active_learning_strategy:
    :return:
    """
    global active_learner, active_learning_strategy
    if new_active_learning_strategy is not None:
        active_learning_strategy = new_active_learning_strategy
        active_learner = PROJECT_PROPERTIES["active_learning_factory"].get_active_learner(active_learning_strategy)


def create_workspace(workspace_id: str, dataset_name: str, dev_dataset_name: str = None, test_dataset_name: str = None):
    """
    create a new workspace
    :param workspace_id:
    :param dataset_name:
    :param dev_dataset_name:
    :param test_dataset_name:
    """
    orchestrator_state_api.create_workspace(workspace_id, dataset_name, dev_dataset_name, test_dataset_name)
    logging.info(f"Creating workspace {workspace_id} using dataset {dataset_name}")


def create_new_category(workspace_id: str, category_name: str, category_description: str,
                        category_labels: Set[str] = BINARY_LABELS):
    """
    declare a new category in the given workspace
    :param workspace_id:
    :param category_name:
    :param category_description:
    :param category_labels:
    """
    orchestrator_state_api.add_category_to_workspace(workspace_id, category_name, category_description, category_labels)


class DeleteModels(Enum):
    ALL = 0
    FALSE = 1
    ALL_BUT_FIRST_MODEL = 2


def delete_workspace(workspace_id: str, delete_models: DeleteModels = DeleteModels.ALL, ignore_errors=False):
    """
    delete a given workspace
    :param workspace_id:
    :param delete_models: ALL - delete all the models of the workspace, FALSE - do not delete models,
    ALL_BUT_FIRST_MODEL - keep the first model of each category
    :param ignore_errors:
    """
    logging.info(f"deleting workspace {workspace_id} ignore errors {ignore_errors}")

    if workspace_exists(workspace_id):
        workspace = orchestrator_state_api.get_workspace(workspace_id)
        try:
            if delete_models != DeleteModels.FALSE:
                for category in workspace.category_to_models:
                    for idx, model_id in enumerate(workspace.category_to_models[category]):
                        if idx == 0 and delete_models == DeleteModels.ALL_BUT_FIRST_MODEL:
                            continue
                        delete_model(workspace_id,category,model_id)
            orchestrator_state_api.delete_workspace_state(workspace_id)
        except Exception as e:
            logging.error(f"error deleting workspace {workspace_id}")
            traceback.print_exc()
            if not ignore_errors:
                raise e
        try:
            data_access.clear_saved_labels(workspace_id, workspace.dataset_name)
            if workspace.dev_dataset_name:
                data_access.clear_saved_labels(workspace_id, workspace.dev_dataset_name)
        except Exception as e:
            logging.error(f"error clearing saved label for workspace {workspace_id}")
            traceback.print_exc()
            if not ignore_errors:
                raise e




def edit_category(workspace_id: str, prev_category_name: str, new_category_name: str, new_category_description: str):
    raise Exception("Not implemented yet")


def delete_category(workspace_id: str, category_name: str):
    orchestrator_state_api.delete_category_from_workspace(workspace_id,category_name)



def add_documents(dataset_name, docs):
    data_access.add_documents(dataset_name=dataset_name, documents=docs)


def query(workspace_id: str, dataset_name: str, category_name: str, query: str,
          sample_size: int, sample_start_idx:int = 0, unlabeled_only: bool = False, remove_duplicates=False) -> Mapping[str, object]:
    """
    query a dataset using the given regex, returning up to *sample_size* elements that meet the query

    :param workspace_id:
    :param dataset_name:
    :param category_name:
    :param query: regex string
    :param unlabeled_only: if True, filters out labeled elements
    :param sample_size: maximum items to return
    :param sample_start_idx: get elements starting from this index (for paging)
    :param remove_duplicates: if True, remove duplicate elements
    :return: a dictionary with two keys: 'results' whose value is a list of TextElements, and 'hit_count' whose
    value is the total number of TextElements in the dataset matched by the query.
    {'results': [TextElement], 'hit_count': int}
    """

    if unlabeled_only:
        return data_access.sample_unlabeled_text_elements(workspace_id=workspace_id, dataset_name=dataset_name,
                                                          category_name=category_name, sample_size=sample_size,
                                                          sample_start_idx = sample_start_idx,
                                                          query=query,
                                                          remove_duplicates=remove_duplicates)
    else:
        return data_access.sample_text_elements_with_labels_info(workspace_id=workspace_id, dataset_name=dataset_name,
                                                                 sample_size=sample_size,
                                                                 sample_start_idx = sample_start_idx,
                                                                 query=query,
                                                                 remove_duplicates=remove_duplicates)


def get_documents(workspace_id: str, dataset_name: str, uris: Sequence[str]) -> List[Document]:
    """
    :rtype: list of Document
    :param workspace_id:
    :param dataset_name:
    :param uris:
    """
    return data_access.get_documents_with_labels_info(workspace_id, dataset_name, uris)


def get_text_elements(workspace_id: str, dataset_name: str, uris: Sequence[str]) -> List[TextElement]:
    """
    :param workspace_id:
    :param dataset_name:
    :param uris:
    """
    return data_access.get_text_elements_with_labels_info(workspace_id, dataset_name, uris)


def _update_recommendation(workspace_id, dataset_name, category_name, count, model: ModelInfo = None):
    """
    Using the AL strategy, update the workspace with next recommended elements for labeling
    :param workspace_id:
    :param dataset_name:
    :param category_name:
    :param count:
    :param model: model to use or None to use the latest model in status READY
    """
    if model is None:
        model = orchestrator_state_api.get_latest_model_by_state(workspace_id, category_name, ModelStatus.READY)
    curr_cat_recommendations = orchestrator_state_api.get_current_category_recommendations(workspace_id, category_name,
                                                                                           model.model_id)
    num_recommendations = len(curr_cat_recommendations)
    if num_recommendations < count:
        orchestrator_state_api.update_active_learning_status(workspace_id, category_name, model.model_id,
                                                             ActiveLearningRecommendationsStatus.AL_IN_PROGRESS)

        new_recommendations = active_learner.get_recommended_items_for_labeling(
            workspace_id=workspace_id, model_id=model.model_id, dataset_name=dataset_name, category_name=category_name,
            sample_size=count)
        orchestrator_state_api.update_category_recommendations(workspace_id=workspace_id, category_name=category_name,
                                                               model_id=model.model_id,
                                                               recommended_items=[x.uri for x in new_recommendations])
        orchestrator_state_api.update_active_learning_status(workspace_id, category_name, model.model_id,
                                                             ActiveLearningRecommendationsStatus.READY)
    return model.model_id


def get_model_active_learning_status(workspace_id, model_id):
    return orchestrator_state_api.get_active_learning_status(workspace_id, model_id)


def get_elements_to_label(workspace_id: str, category_name: str, count: int) -> Sequence[TextElement]:
    """
    returns a list of the top *count* elements recommended for labeling by the AL strategy.
    The active learner is invoked only if the requested count of elements have not yet been added to the workspace.
    :param workspace_id:
    :param category_name:
    :param count:
    """
    dataset_name = get_workspace(workspace_id).dataset_name
    model_id = _update_recommendation(workspace_id, dataset_name, category_name, count)
    recommended_uris = orchestrator_state_api.get_current_category_recommendations(workspace_id, category_name, model_id)
    updated_recommended = get_text_elements(workspace_id, dataset_name, recommended_uris)
    return updated_recommended


def set_labels(workspace_id: str, labeled_sentences: Sequence[Tuple[str, Mapping[str, Label]]],
               propagate_to_duplicates=False):
    """
    set labels for URIs.
    :param workspace_id:
    :param labeled_sentences: Sequence of tuples of URI and a dict in the format of {"category_name":Label},
    where Label is an instance of data_structs.Label
    :param propagate_to_duplicates: if True, also set the same labels for additional URIs that are duplicates of
    the URIs provided.
    """

    return_value = data_access.set_labels(workspace_id, labeled_sentences, propagate_to_duplicates)
    return return_value


def unset_labels(workspace_id: str, category_name, uris: Sequence[str]):
    """
    unset labels of a given category for URIs.
    :param workspace_id:
    :param category_name:
    :param uris:
    """
    data_access.unset_labels(workspace_id, category_name, uris)


def get_all_labeled_text_elements(workspace_id, dataset_name, category) -> Mapping:
    return data_access.sample_labeled_text_elements(workspace_id, dataset_name, category, 10 ** 6,
                                                    remove_duplicates=False)

 
def sample_text_elements(workspace_id, dataset_name, sample_size, random_state: int = 0) -> Mapping:
    return data_access.sample_text_elements_with_labels_info(workspace_id, dataset_name, sample_size,
                                                             remove_duplicates=False, random_state=random_state)


def sample_unlabeled_text_elements(workspace_id, dataset_name, category, sample_size, random_state: int = 0) -> Mapping:
    return data_access.sample_unlabeled_text_elements(workspace_id, dataset_name, category, sample_size,
                                                      remove_duplicates=False, random_state=random_state)


def train(workspace_id: str, category_name: str, model_type: ModelType, train_data, dev_data,
          train_params=None):
    """
    train a model for a category in the specified workspace
    :param workspace_id:
    :param category_name:
    :param model_type:
    :param train_data:
    :param dev_data:
    :param train_params:
    :return: model_id
    """
    def get_counts_per_label(text_elements):
        label_objects = [element.category_to_label[category_name] for element in text_elements]
        # flatten list of sets and incorporate metadata into label names
        label_names = [label if len(label_obj.metadata) == 0 else f'{next(iter(label_obj.metadata))}_{label}'
                       for label_obj in label_objects for label in label_obj.labels]
        return dict(Counter(label_names))

    model_metadata = dict()
    train_counts = get_counts_per_label(train_data)
    model_metadata[TRAIN_COUNTS_STR_KEY] = train_counts
    if dev_data is not None:
        model_metadata[DEV_COUNTS_STR_KEY] = get_counts_per_label(dev_data)

    workspace = get_workspace(workspace_id)
    logging.info(
        f"workspace {workspace_id} training a model for category '{category_name}', model_metadata: {model_metadata}")
    all_category_labels = workspace.category_to_labels[category_name]
    train_data = _convert_to_dicts_with_numeric_labels(train_data, category_name, all_category_labels)
    if dev_data:
        dev_data = _convert_to_dicts_with_numeric_labels(dev_data, category_name, all_category_labels)

    params = {} if train_params is None else train_params

    train_and_infer = PROJECT_PROPERTIES["train_and_infer_factory"].get_model(model_type)
    logging.info(f'start training using {len(train_data)} items')
    model_id = train_and_infer.train(train_data=train_data, dev_data=dev_data,
                                     train_params=params)
    logging.info(f"new model id is {model_id}")

    model_status = train_and_infer.get_model_status(model_id)
    orchestrator_state_api.add_model(workspace_id=workspace_id, category_name=category_name, model_id=model_id,
                                     model_status=model_status, model_type=model_type,
                                     model_metadata={**model_metadata, **params})
    return model_id


def get_model_status(workspace_id: str, model_id: str) -> ModelStatus:
    """
    ModelStatus can be TRAINING, READY or ERROR
    :param workspace_id:
    :param model_id:
    :return:
    """
    model = _get_model(workspace_id, model_id)
    return model.model_status


def get_model_train_counts(workspace_id: str, model_id: str) -> Mapping:
    """
    number of elements for each label that were used to train a given model
    :param workspace_id:
    :param model_id:
    :return:
    """
    model = _get_model(workspace_id, model_id)
    return model.model_metadata[TRAIN_COUNTS_STR_KEY]


def get_all_models_for_category(workspace_id, category_name: str):
    """
    :param workspace_id:
    :param category_name:
    :return: dict from model_id to ModelInfo
    """
    workspace = get_workspace(workspace_id)
    return workspace.category_to_models.get(category_name, {})


def infer(workspace_id: str, category_name: str, elements_to_infer: Sequence[TextElement], model_id: str = None,
          infer_params: dict = None, use_cache: bool = True) -> dict:
    """
    get the prediction for a list of TextElements
    :param workspace_id:
    :param category_name:
    :param elements_to_infer: list of TextElements
    :param model_id: model_id to use. If set to None, the latest model for the category will be used
    :param infer_params: dictionary for additional inference parameters. Default is None
    :param use_cache: utilize a cache that stores inference results
    :return: a dictionary of inference results, with at least the "labels" key, where the value is a list of string
    labels for each element in texts_to_infer. Additional keys, with list values of the same length, can be passed.
    e.g. {"labels": [False, True, True],
          "scores": [0.23, 0.79, 0.98],
          "gradients": [[0.24, -0.39, -0.66, 0.25], [0.14, 0.29, -0.26, 0.16], [-0.46, 0.61, -0.02, 0.23]]}
    """
    if len(elements_to_infer) == 0:
        return {'labels': [], 'scores': []}

    models = get_all_models_for_category(workspace_id, category_name)
    if len(models) == 0:
        raise Exception(f"There are no models in workspace {workspace_id} for category {category_name}")
    if model_id is None:  # use latest
        model = orchestrator_state_api.get_latest_model_by_state(workspace_id=workspace_id,
                                                                 category_name=category_name,
                                                                 model_status=ModelStatus.READY)
    else:
        model = _get_model(workspace_id, model_id)
        if model.model_status is not ModelStatus.READY:
            raise Exception(f"model id {model_id} is not in READY status")
    train_and_infer = PROJECT_PROPERTIES["train_and_infer_factory"].get_model(model.model_type)
    list_of_dicts = [{"text": element.text} for element in elements_to_infer]
    infer_results = train_and_infer.infer(model_id=model.model_id, items_to_infer=list_of_dicts,
                                          infer_params=infer_params, use_cache=use_cache)

    all_labels = get_workspace(workspace_id).category_to_labels[category_name]
    is_multi_label = isinstance(infer_results['labels'][0], list)
    if is_multi_label:
        mlb = MultiLabelBinarizer(classes=sorted(all_labels)).fit(None)
        infer_results['labels'] = [list(x) for x in mlb.inverse_transform(np.array(infer_results['labels']))]
    else:
        numeric_label_to_text = {i: label for i, label in enumerate(sorted(all_labels))}
        infer_results['labels'] = [numeric_label_to_text[l] for l in infer_results['labels']]

    return infer_results


def infer_by_uris(workspace_id: str, category_name: str, uris_to_infer: Sequence[str], model_id: str = None,
                  infer_params: dict = None, use_cache: bool = True) -> dict:
    """
    get the prediction for a list of URIs
    :param workspace_id:
    :param category_name:
    :param uris_to_infer: list of uris (str)
    :param model_id: model_id to use. If set to None, the latest model for the category will be used
    :param infer_params: dictionary for additional inference parameters. Default is None
    :param use_cache: utilize a cache that stores inference results
    :return: a dictionary of inference results, with at least the "labels" key, where the value is a list of string
    labels for each element in texts_to_infer. Additional keys, with list values of the same length, can be passed.
    e.g. {"labels": [False, True, True],
          "scores": [0.23, 0.79, 0.98],
          "gradients": [[0.24, -0.39, -0.66, 0.25], [0.14, 0.29, -0.26, 0.16], [-0.46, 0.61, -0.02, 0.23]]}
    """
    dataset_name = get_workspace(workspace_id).dataset_name
    elements_to_infer = data_access.get_text_elements_with_labels_info(workspace_id, dataset_name, uris_to_infer)
    return infer(workspace_id, category_name, elements_to_infer, model_id, infer_params, use_cache)


def get_all_text_elements(dataset_name: str) -> List[TextElement]:
    """
    get all the text elements of the given dataset
    :param dataset_name:
    """
    return data_access.get_all_text_elements(dataset_name=dataset_name)


def get_all_text_elements_uris(dataset_name: str) -> List[str]:
    """
    Return a List of all TextElement uris in the given dataset_name.
    :param dataset_name: the name of the dataset from which the TextElement uris should be retrieved.
    :return: a List of all TextElement uris in the given dataset_name.
    """
    return data_access.get_all_text_elements_uris(dataset_name=dataset_name)


def get_all_document_uris(workspace_id):
    dataset_name = get_workspace(workspace_id).dataset_name
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

def delete_model(workspace_id, category_name, model_id):
    model_info = _get_model(workspace_id, model_id)
    train_and_infer = PROJECT_PROPERTIES["train_and_infer_factory"].get_model(model_info.model_type)

    if model_info.model_status == ModelStatus.DELETED:
        raise Exception(
            f"trying to delete model id {model_id} which is already in {ModelStatus.DELETED} from"
            f" workspace {workspace_id} in category {category_name}")

    logging.info(
        f"marking model id {model_id} from workspace {workspace_id} in category {category_name} as deleted, and deleting the model")
    orchestrator_state_api.update_model_state(workspace_id, category_name, model_id,ModelStatus.DELETED)
    train_and_infer.delete_model(model_id)


def add_train_param(workspace_id: str, train_param_key: str, train_param_value: str):
    raise Exception("Not implemented yet")


def workspace_exists(workspace_id: str) -> bool:
    return orchestrator_state_api.workspace_exists(workspace_id)


def get_workspace(workspace_id):
    if not workspace_exists(workspace_id):
        raise Exception(f"workspace_id '{workspace_id}' doesn't exist")
    return orchestrator_state_api.get_workspace(workspace_id)


def _get_model(workspace_id, model_id) -> ModelInfo:
    workspace = get_workspace(workspace_id)
    all_models = {k: v for d in workspace.category_to_models.values() for k, v in d.items()}
    if all_models[model_id]:
        return all_models[model_id]
    raise Exception(f"model id {model_id} does not exist in workspace {workspace_id}")

def add_documents_from_file(dataset_name,temp_filename):
    from lrtc_lib.data_access.single_dataset_loader import load_dataset_using_processor
    from lrtc_lib.data_access.processors.live_process_csv_data import LiveCsvProcessor
    return load_dataset_using_processor(dataset_name,False,LiveCsvProcessor(dataset_name,temp_filename))


def get_contradictions_report_with_diffs(workspace_id, category_name) -> List[Tuple[TextElement]]:
    dataset_name = get_workspace(workspace_id).dataset_name
    labeled_elements = get_all_labeled_text_elements(workspace_id, dataset_name, category_name)["results"]
    return get_suspected_labeling_contradictions_by_distance_with_diffs(labeled_elements, category_name)


# TODO more complicated as get_disagreements_between_labels_and_model uses train_and_dev_set_selectors which use the workspace internally
# (and if we keep it we have a circular dependency
def get_suspicious_elements_report(workspace_id, category_name, model_type: ModelType = ModelTypes.M_SVM) -> List[TextElement]:
    dataset_name = get_workspace(workspace_id).dataset_name
    return get_disagreements_using_cross_validation(workspace_id, dataset_name, category_name, model_type)


def get_ngrams_by_info_gain(texts, labels, ngram_max_length, language) -> List[Tuple[str, float]]:
    return ngrams_by_info_gain(texts, labels, ngram_max_length=ngram_max_length, language=language)


def sample_elements_by_prediction(workspace_id, category, size, unlabeled_only=False, required_label=LABEL_POSITIVE,
                                  random_state: int = 0):
    dataset_name = get_workspace(workspace_id).dataset_name
    if unlabeled_only:
        sample_elements = sample_unlabeled_text_elements(
            workspace_id, dataset_name, category, size * 10000, random_state)["results"]
    else:
        sample_elements = sample_text_elements(
            workspace_id, dataset_name, size * 10000, random_state)["results"]
    sample_elements_predictions = infer(workspace_id, category, sample_elements)["labels"]
    prediction_sample = \
        [text_element for text_element, prediction in zip(sample_elements, sample_elements_predictions) if
         prediction == required_label]
    # TODO: add predictions to the elements here
    return prediction_sample[:size]
