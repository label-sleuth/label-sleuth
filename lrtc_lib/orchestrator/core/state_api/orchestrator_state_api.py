from typing import Sequence, Set
import jsonpickle
import os
from collections import OrderedDict, defaultdict
from dataclasses import dataclass
from dataclasses import field
from datetime import datetime
from enum import Enum
import functools
import threading

from lrtc_lib.data_access.core.utils import get_all_datasets
from lrtc_lib.definitions import WORKSPACE_DATA_DIR
from lrtc_lib.models.core.model_api import ModelStatus
from lrtc_lib.models.core.model_types import ModelTypes

WORKSPACE_CLASS_VERSION = 2


@dataclass
class Workspace:
    workspace_id: str
    dataset_name: str
    dev_dataset_name: str
    test_dataset_name: str
    category_to_description: 'dict' = field(default_factory=dict)
    category_to_labels: 'dict' = field(default_factory=dict)
    category_to_number_of_label_changed: 'dict' = field(default_factory=dict)
    category_to_models: OrderedDict = field(default_factory=OrderedDict)  # category_name to model_id to ModelInfo
    category_to_model_to_recommendations: 'dict' = field(
        default_factory=lambda: defaultdict(OrderedDict))  # category to {model_id:[TextElement...]}
    category_to_model_to_recommendations_status: 'dict' = field(default_factory=lambda: defaultdict(OrderedDict))
    train_params: 'dict' = field(default_factory=dict)
    workspace_class_version: 'int' = WORKSPACE_CLASS_VERSION

    @classmethod
    def get_field_names(cls):
        return cls.__annotations__.keys()


class ActiveLearningRecommendationsStatus(Enum):
    MODEL_NOT_READY = 0
    AL_NOT_STARTED = 1
    AL_IN_PROGRESS = 2
    READY = 3


@dataclass
class ModelInfo:
    model_id: str
    model_status: ModelStatus
    creation_date: datetime
    model_type: ModelTypes
    model_metadata: dict


lock = threading.RLock()


def withlock(func):
    @functools.wraps(func)
    def wrapper(*a, **k):
        with lock:
            return func(*a, **k)

    return wrapper


def _filename_from_workspace_id(workspace_id: str):
    return workspace_id + ".json"


@withlock
def create_workspace(workspace_id: str, dataset_name: str, dev_dataset_name: str = None, test_dataset_name: str = None):
    illegal_chars = "".join(x for x in workspace_id if not x.isalnum() and x not in "_-")
    assert len(illegal_chars) == 0, f"Workspace id '{workspace_id}' contains illegal characters: '{illegal_chars}'"

    assert dataset_name in get_all_datasets(), f"Dataset {dataset_name} does not exist, existing datasets are:" \
                                               f"\n{get_all_datasets()}"

    workspace = Workspace(workspace_id=workspace_id, dataset_name=dataset_name, dev_dataset_name=dev_dataset_name,
                          test_dataset_name=test_dataset_name)

    if _filename_from_workspace_id(workspace_id) in os.listdir(WORKSPACE_DATA_DIR):
        raise Exception(f"workspace name '{workspace_id}' already exists")

    _save_workspace(workspace)


def _save_workspace(workspace: Workspace):
    workspace_encoded = jsonpickle.encode(workspace)
    with open(os.path.join(WORKSPACE_DATA_DIR, _filename_from_workspace_id(workspace.workspace_id)), 'w') as f:
        f.write(workspace_encoded)


@withlock
def delete_workspace_state(workspace_id: str):
    os.remove(os.path.join(WORKSPACE_DATA_DIR, _filename_from_workspace_id(workspace_id)))
    if workspace_id in workspaces:
        del workspaces[workspace_id]


@withlock
def delete_category_from_workspace(workspace_id: str, category_name: str):
    workspace = _load_workspace(workspace_id)
    for field_name in workspace.get_field_names():
        if field_name.startswith("category_to"):
            field_dict = getattr(workspace, field_name)
            if category_name in field_dict:
                field_dict.pop(category_name)


workspaces = dict()


def _load_workspace(workspace_id) -> Workspace:
    cached_workspace = workspaces.get(workspace_id)
    if cached_workspace:
        return cached_workspace
    with open(os.path.join(WORKSPACE_DATA_DIR, _filename_from_workspace_id(workspace_id))) as json_file:
        workspace = json_file.read()
    workspace = jsonpickle.decode(workspace)
    workspaces[workspace_id] = workspace
    return workspace


@withlock
def add_category_to_workspace(workspace_id: str, category_name: str, category_description: str,
                              category_labels: Set[str]):
    workspace = _load_workspace(workspace_id)
    if category_name in workspace.category_to_description:
        raise Exception(f"Category '{category_name}' already exists in workspace '{workspace_id}'")
    workspace.category_to_description[category_name] = category_description
    workspace.category_to_labels[category_name] = category_labels
    _save_workspace(workspace)


@withlock
def get_current_category_recommendations(workspace_id: str, category_name: str, model_id) -> Sequence[str]:
    workspace = _load_workspace(workspace_id)

    if model_id not in workspace.category_to_model_to_recommendations[category_name]:
        return []

    return workspace.category_to_model_to_recommendations[category_name][model_id]


@withlock
def update_category_recommendations(workspace_id: str, category_name: str, model_id: str,
                                    recommended_items: Sequence[str]):
    workspace = _load_workspace(workspace_id)
    current_recommendations = workspace.category_to_model_to_recommendations[category_name].get(model_id, None)
    if current_recommendations is None:
        workspace.category_to_model_to_recommendations[category_name][model_id] = recommended_items
    else:
        current_recommendations.extend(recommended_items)
    _save_workspace(workspace)


@withlock
def set_number_of_changes_since_last_model(workspace_id: str, category_name: str, number_of_changes: int):
    workspace = _load_workspace(workspace_id)
    workspace.category_to_number_of_label_changed[category_name] = number_of_changes
    _save_workspace(workspace)


@withlock
def increase_number_of_changes_since_last_model(workspace_id: str, category_name: str, number_of_new_changes: int):
    workspace = _load_workspace(workspace_id)
    workspace.category_to_number_of_label_changed[category_name] = \
        workspace.category_to_number_of_label_changed.get(category_name, 0) + number_of_new_changes
    _save_workspace(workspace)


@withlock
def get_number_of_changed_since_last_model(workspace_id: str, category_name: str):
    workspace = _load_workspace(workspace_id)
    return workspace.category_to_number_of_label_changed.get(category_name, 0)


@withlock
def get_workspace(workspace_id):
    return _load_workspace(workspace_id)


@withlock
def add_model(workspace_id: str, category_name: str, model_id: str, model_status: ModelStatus, model_type: ModelTypes,
              model_metadata: dict):
    workspace = _load_workspace(workspace_id)
    if category_name not in workspace.category_to_description:
        raise Exception(
            f"Cannot add a model for unknown category '{category_name}', please use add_category_to_workspace first")
    category_models = workspace.category_to_models.get(category_name, OrderedDict())
    if model_id in category_models:
        raise Exception(f"Model id '{model_id}' already exists in workspace '{workspace_id}'")
    category_models[model_id] = ModelInfo(model_id=model_id, model_status=model_status, model_type=model_type,
                                          model_metadata=model_metadata, creation_date=datetime.now())
    workspace.category_to_models[category_name] = category_models

    category_model_statuses = workspace.category_to_model_to_recommendations_status.get(category_name, OrderedDict())
    if model_status == ModelStatus.READY:
        category_model_statuses[model_id] = ActiveLearningRecommendationsStatus.AL_NOT_STARTED
    elif model_status == ModelStatus.TRAINING:
        category_model_statuses[model_id] = ActiveLearningRecommendationsStatus.MODEL_NOT_READY
    else:
        raise Exception("Model status should be either READY or TRAINING")
    workspace.category_to_model_to_recommendations_status[category_name] = category_model_statuses
    _save_workspace(workspace)


@withlock
def get_latest_model_by_state(workspace_id: str, category_name: str, model_status: ModelStatus):
    workspace = _load_workspace(workspace_id)
    assert workspace.category_to_models, f"No models found in workspace_id {workspace_id}"
    models = workspace.category_to_models[category_name]
    assert models, f"No models found in workspace_id {workspace_id} for category {category_name}"
    for model_name, model_params in reversed(models.items()):
        if model_params.model_status == model_status:
            return model_params


@withlock
def get_latest_model_id_by_al_status(workspace_id: str, category_name: str,
                                     al_status: ActiveLearningRecommendationsStatus):
    workspace = _load_workspace(workspace_id)
    models = workspace.category_to_model_to_recommendations_status[category_name]
    for model_id, model_al_status in reversed(models.items()):
        if model_al_status == al_status:
            return model_id
    return None


@withlock
def get_model_status(workspace_id: str, category_name: str, model_id):
    workspace = _load_workspace(workspace_id)
    models = workspace.category_to_models[category_name]
    return models[model_id].model_status


@withlock
def get_all_models_by_state(workspace_id: str, category_name: str, model_status: ModelStatus):
    workspace = _load_workspace(workspace_id)
    if category_name not in workspace.category_to_models:
        return []
    models = workspace.category_to_models[category_name]
    return [model_params for model_name, model_params in models.items() if model_params.model_status == model_status]


@withlock
def get_all_workspaces() -> Sequence[Workspace]:
    all_workspaces = []
    for file in os.listdir(WORKSPACE_DATA_DIR):
        if file.startswith('.') or not file.endswith('.json'):
            continue
        workspace_id, _ = os.path.splitext(file)
        workspace = _load_workspace(workspace_id)
        all_workspaces.append(workspace)
    return all_workspaces


@withlock
def update_model_state(workspace_id: str, category_name: str, model_id: str, new_status: ModelStatus):
    workspace = _load_workspace(workspace_id)
    assert len(workspace.category_to_models) > 0, f"No models found in workspace_id {workspace_id}"

    models = workspace.category_to_models[category_name]
    assert len(models) > 0, f"No models found in workspace_id {workspace_id} for category {category_name}"

    assert model_id in models, f"Model id '{model_id}' doesn't exist in workspace '{workspace_id}'"

    models[model_id].model_status = new_status
    _save_workspace(workspace)


@withlock
def copy_workspace(existing_workspace_id: str, new_workspace_id: str):
    workspace = _load_workspace(existing_workspace_id)
    workspace.workspace_id = new_workspace_id
    _save_workspace(workspace)


@withlock
def workspace_exists(workspace_id: str) -> bool:
    return os.path.exists(os.path.join(WORKSPACE_DATA_DIR, _filename_from_workspace_id(workspace_id)))


@withlock
def add_train_param(workspace_id: str, train_param_key: str, train_param_value: str):
    workspace = _load_workspace(workspace_id)
    workspace.train_params[train_param_key] = train_param_value
    _save_workspace(workspace)


@withlock
def update_active_learning_status(workspace_id, category_name, model_id,
                                  new_status: ActiveLearningRecommendationsStatus):
    workspace = _load_workspace(workspace_id)
    model_to_recommendation_status = workspace.category_to_model_to_recommendations_status[category_name]
    model_to_recommendation_status[model_id] = new_status
    _save_workspace(workspace)


@withlock
def get_active_learning_status(workspace_id, model_id):
    workspace = _load_workspace(workspace_id)
    for models_of_category in workspace.category_to_model_to_recommendations_status.values():
        status = models_of_category.get(model_id)
        if status:
            return status
    return None


@withlock
def add_model_metadata(workspace_id, category_name, model_id, metadata: dict):
    workspace = _load_workspace(workspace_id)
    workspace.category_to_models[category_name][model_id].model_metadata.update(metadata)
    _save_workspace(workspace)
