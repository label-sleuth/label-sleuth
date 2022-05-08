from typing import Sequence, Mapping, Dict, List
import jsonpickle
import os
from collections import OrderedDict, defaultdict
from dataclasses import dataclass
from dataclasses import field
from datetime import datetime
from enum import Enum
import functools
import threading


from lrtc_lib.definitions import WORKSPACE_DATA_DIR
from lrtc_lib.models.core.model_api import ModelStatus
from lrtc_lib.models.core.model_types import ModelTypes

WORKSPACE_CLASS_VERSION = 2


class IterationStatus(Enum):
    TRAINING = 0
    RUNNING_INFERENCE = 1 # over the whole dataset
    RUNNING_ACTIVE_LEARNING = 2
    CALCULATING_STATISTICS = 3
    READY = 4
    ERROR = 5
    MODEL_DELETED = 6

    # MODEL_NOT_READY = 0
    # AL_NOT_STARTED = 1
    # AL_IN_PROGRESS = 2
    # READY = 3


@dataclass
class ModelInfo:
    model_id: str
    model_status: ModelStatus
    creation_date: datetime
    model_type: ModelTypes
    model_metadata: dict


@dataclass
class ActiveLearningIteration: # do we have a better name for this Iteration?
    model: ModelInfo
    status: IterationStatus
    iteration_statistics: Dict = field(default_factory=dict)
    active_learning_recommendations: Sequence[str] = field(default_factory=list)


@dataclass
class Category:
    name: str
    description: str
    label_change_count_since_last_train: int = 0
    active_learning_iterations: List[ActiveLearningIteration] = field(default_factory=list) # can be changed to SortedDict


@dataclass
class Workspace:
    workspace_id: str
    dataset_name: str
    categories: Dict[str, Category] = field(default_factory=dict) #category_to_description: 'dict' = field(default_factory=dict)
    #category_to_number_of_label_changed: 'dict' = field(default_factory=dict)
    # category_to_models: OrderedDict = field(default_factory=OrderedDict)  # category_name to model_id to ModelInfo
    # category_to_model_to_recommendations: 'dict' = field(
    #     default_factory=lambda: defaultdict(OrderedDict))  # category to {model_id:[TextElement...]}
    # category_to_model_to_recommendations_status: 'dict' = field(default_factory=lambda: defaultdict(OrderedDict))
    workspace_class_version: 'int' = WORKSPACE_CLASS_VERSION

    @classmethod
    def get_field_names(cls):
        return cls.__annotations__.keys()








lock = threading.RLock()


def withlock(func): # TODO lock per workspace
    @functools.wraps(func)
    def wrapper(*a, **k):
        with lock:
            return func(*a, **k)

    return wrapper


def _filename_from_workspace_id(workspace_id: str):
    return workspace_id + ".json"


@withlock
def create_workspace(workspace_id: str, dataset_name: str):
    illegal_chars = "".join(x for x in workspace_id if not x.isalnum() and x not in "_-")
    assert len(illegal_chars) == 0, f"Workspace id '{workspace_id}' contains illegal characters: '{illegal_chars}'"

    workspace = Workspace(workspace_id=workspace_id, dataset_name=dataset_name)

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
    workspace.categories.pop(category_name)


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
def add_category_to_workspace(workspace_id: str, category_name: str, category_description: str):
    workspace = _load_workspace(workspace_id)
    if category_name in workspace.categories:
        raise Exception(f"Category '{category_name}' already exists in workspace '{workspace_id}'")
    workspace.categories[category_name] = Category(name=category_name, description=category_description)
    _save_workspace(workspace)


@withlock
def get_current_category_recommendations(workspace_id: str, category_name: str) -> Sequence[str]:
    workspace = _load_workspace(workspace_id)
    category = workspace.categories[category_name]

    for iteration in reversed(category.active_learning_iterations):
        if iteration.status == IterationStatus.READY:
            return iteration.active_learning_recommendations
    return []

@withlock
def update_category_recommendations(workspace_id: str, category_name: str, iteration_index: int,
                                    recommended_items: Sequence[str]):
    workspace = _load_workspace(workspace_id)
    workspace.categories[category_name].active_learning_iterations[iteration_index].active_learning_recommendations = \
        recommended_items
    _save_workspace(workspace)


@withlock
def set_label_change_count_since_last_train(workspace_id: str, category_name: str, number_of_changes: int):
    workspace = _load_workspace(workspace_id)
    workspace.categories[category_name].label_change_count_since_last_train = number_of_changes
    _save_workspace(workspace)


@withlock
def increase_label_change_count_since_last_train(workspace_id: str, category_name: str, number_of_new_changes: int):
    workspace = _load_workspace(workspace_id)
    workspace.categories[category_name].label_change_count_since_last_train = \
        workspace.categories[category_name].label_change_count_since_last_train + number_of_new_changes
    _save_workspace(workspace)


@withlock
def get_label_change_count_since_last_train(workspace_id: str, category_name: str):
    workspace = _load_workspace(workspace_id)
    return workspace.categories[category_name].label_change_count_since_last_train


@withlock
def get_workspace(workspace_id):
    return _load_workspace(workspace_id)


@withlock
def add_iteration(workspace_id: str, category_name: str, model_info: ModelInfo):
    workspace = _load_workspace(workspace_id)
    iteration = ActiveLearningIteration(model=model_info, status=IterationStatus.TRAINING)
    workspace.categories[category_name].active_learning_iterations.append(iteration)
    _save_workspace(workspace)


#
# @withlock
# def get_model_status(workspace_id: str, category_name: str, model_id):
#     workspace = _load_workspace(workspace_id)
#     models = workspace.category_to_models[category_name]
#     return models[model_id].model_status
#
#

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
def update_model_state(workspace_id: str, category_name: str, iteration_index: int, new_status: ModelStatus):
    workspace = _load_workspace(workspace_id)
    iterations = workspace.categories[category_name].active_learning_iterations
    assert len(iterations) > iteration_index, f"Iteration '{iteration_index}' doesn't exist in workspace '{workspace_id}'"
    iterations[iteration_index].model.model_status = new_status
    _save_workspace(workspace)


@withlock
def workspace_exists(workspace_id: str) -> bool:
    return os.path.exists(os.path.join(WORKSPACE_DATA_DIR, _filename_from_workspace_id(workspace_id)))


@withlock
def update_iteration_status(workspace_id, category_name, iteration_index, new_status: IterationStatus):
    workspace = _load_workspace(workspace_id)
    workspace.categories[category_name].active_learning_iterations[iteration_index].status = new_status
    _save_workspace(workspace)


@withlock
def get_iteration_status(workspace_id, category_name, iteration_index):
    workspace = _load_workspace(workspace_id)
    return workspace.categories[category_name].active_learning_iterations[iteration_index].status



@withlock
def add_iteration_statistics(workspace_id, category_name, iteration_index, statistics_dict: dict):
    workspace = _load_workspace(workspace_id)
    iteration = workspace.categories[category_name].active_learning_iterations[iteration_index]
    iteration.iteration_statistics.update(statistics_dict)
    _save_workspace(workspace)


@withlock
def mark_iteration_model_as_deleted(workspace_id, category_name, iteration_index):
    workspace = _load_workspace(workspace_id)
    iteration = workspace.categories[category_name].active_learning_iterations[iteration_index]
    iteration.model.model_status = ModelStatus.DELETED
    iteration.status = IterationStatus.MODEL_DELETED
    _save_workspace(workspace)


@withlock
def get_all_iterations(workspace_id, category_name):
    workspace = _load_workspace(workspace_id)
    return workspace.categories[category_name].active_learning_iterations


@withlock
def get_all_iterations_by_status(workspace_id, category_name, status: IterationStatus):
    workspace = _load_workspace(workspace_id)
    return [iteration for iteration in workspace.categories[category_name].active_learning_iterations
            if iteration.status == status]
