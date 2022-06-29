#
#  Copyright (c) 2022 IBM Corp.
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#  http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#

import os
import threading
from collections import defaultdict

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Sequence, Tuple

import jsonpickle

from label_sleuth.models.core.languages import Language
from label_sleuth.models.core.model_api import ModelStatus
from label_sleuth.models.core.model_type import ModelType


class IterationStatus(Enum):
    TRAINING = 0
    RUNNING_INFERENCE = 1
    RUNNING_ACTIVE_LEARNING = 2
    CALCULATING_STATISTICS = 3
    READY = 4
    ERROR = 5
    MODEL_DELETED = 6


@dataclass
class ModelInfo:
    model_id: str
    model_status: ModelStatus
    creation_date: datetime
    model_type: ModelType
    language: Language
    train_statistics: dict


@dataclass
class Iteration:
    """
    This class stores information about an iteration. The flow of an iteration includes training a model,
    inferring the full corpus using this model, choosing candidate elements for labeling using active learning, as
    well as calculating various statistics. Each iteration is associated with a specific Category.
    """
    model: ModelInfo
    status: IterationStatus
    iteration_statistics: Dict = field(default_factory=dict)
    active_learning_recommendations: Sequence[str] = field(default_factory=list)


@dataclass
class Category:
    name: str
    description: str
    label_change_count_since_last_train: int = 0
    iterations: List[Iteration] = field(default_factory=list)


@dataclass
class Workspace:
    workspace_id: str
    dataset_name: str
    categories: Dict[str, Category] = field(default_factory=dict)


class OrchestratorStateApi:

    def __init__(self, workspaces_dir):
        self.workspace_dir = workspaces_dir
        os.makedirs(self.workspace_dir, exist_ok=True)
        self.workspaces = dict()  # in-memory cache for Workspace objects
        self.workspaces_lock = defaultdict(threading.RLock)  # lock for methods that access or manipulate the workspaces

    # Workspace-related methods

    def create_workspace(self, workspace_id: str, dataset_name: str):
        with self.workspaces_lock[workspace_id]:
            illegal_chars = "".join(x for x in workspace_id if not x.isalnum() and x not in "_-")
            assert len(illegal_chars) == 0, \
                f"Workspace id '{workspace_id}' contains illegal characters: '{illegal_chars}'"

            workspace = Workspace(workspace_id=workspace_id, dataset_name=dataset_name)

            if self._filename_from_workspace_id(workspace_id) in os.listdir(self.workspace_dir):
                raise Exception(f"workspace name '{workspace_id}' already exists")
            self._save_workspace(workspace)

    def get_workspace(self, workspace_id) -> Workspace:
        with self.workspaces_lock[workspace_id]:
            return self._load_workspace(workspace_id)

    def workspace_exists(self, workspace_id: str) -> bool:
        with self.workspaces_lock[workspace_id]:
            return os.path.exists(os.path.join(self.workspace_dir, self._filename_from_workspace_id(workspace_id)))

    def delete_workspace_state(self, workspace_id: str):
        with self.workspaces_lock[workspace_id]:
            os.remove(os.path.join(self.workspace_dir, self._filename_from_workspace_id(workspace_id)))
            if workspace_id in self.workspaces:
                del self.workspaces[workspace_id]

    def get_all_workspaces(self) -> Sequence[Workspace]:
        all_workspaces = []
        for file in os.listdir(self.workspace_dir):
            if file.startswith('.') or not file.endswith('.json'):
                continue
            workspace_id, _ = os.path.splitext(file)
            workspace = self.get_workspace(workspace_id)
            all_workspaces.append(workspace)
        return all_workspaces

    def _load_workspace(self, workspace_id) -> Workspace:
        cached_workspace = self.workspaces.get(workspace_id)
        if cached_workspace:
            return cached_workspace
        with open(os.path.join(self.workspace_dir, self._filename_from_workspace_id(workspace_id))) as json_file:
            workspace = json_file.read()
        workspace = jsonpickle.decode(workspace)
        self.workspaces[workspace_id] = workspace
        return workspace

    def _save_workspace(self, workspace: Workspace):
        workspace_encoded = jsonpickle.encode(workspace)
        with open(os.path.join(self.workspace_dir, self._filename_from_workspace_id(workspace.workspace_id)), 'w') as f:
            f.write(workspace_encoded)

    @staticmethod
    def _filename_from_workspace_id(workspace_id: str):
        return workspace_id + ".json"

    # Category-related methods

    def add_category_to_workspace(self, workspace_id: str, category_name: str, category_description: str):
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            if category_name in workspace.categories:
                raise Exception(f"Category '{category_name}' already exists in workspace '{workspace_id}'")
            workspace.categories[category_name] = Category(name=category_name, description=category_description)
            self._save_workspace(workspace)

    def delete_category_from_workspace(self, workspace_id: str, category_name: str):
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            workspace.categories.pop(category_name)
            self._save_workspace(workspace)

    def get_current_category_recommendations(self, workspace_id: str, category_name: str) -> Sequence[str]:
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            category = workspace.categories[category_name]

            for iteration in reversed(category.iterations):
                if iteration.status == IterationStatus.READY:
                    return iteration.active_learning_recommendations
            return []

    def update_category_recommendations(self, workspace_id: str, category_name: str, iteration_index: int,
                                        recommended_items: Sequence[str]):
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            workspace.categories[category_name].iterations[iteration_index].active_learning_recommendations \
                = recommended_items
            self._save_workspace(workspace)

    def get_label_change_count_since_last_train(self, workspace_id: str, category_name: str) -> int:
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            return workspace.categories[category_name].label_change_count_since_last_train

    def set_label_change_count_since_last_train(self, workspace_id: str, category_name: str, number_of_changes: int):
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            workspace.categories[category_name].label_change_count_since_last_train = number_of_changes
            self._save_workspace(workspace)

    def increase_label_change_count_since_last_train(self, workspace_id: str, category_name: str,
                                                     number_of_new_changes: int):
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            workspace.categories[category_name].label_change_count_since_last_train = \
                workspace.categories[category_name].label_change_count_since_last_train + number_of_new_changes
            self._save_workspace(workspace)

    # Iteration-related methods

    def add_iteration(self, workspace_id: str, category_name: str, model_info: ModelInfo):
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            iteration = Iteration(model=model_info, status=IterationStatus.TRAINING)
            workspace.categories[category_name].iterations.append(iteration)
            self._save_workspace(workspace)

    def get_iteration_status(self, workspace_id, category_name, iteration_index) -> IterationStatus:
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            return workspace.categories[category_name].iterations[iteration_index].status

    def update_iteration_status(self, workspace_id, category_name, iteration_index, new_status: IterationStatus):
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            workspace.categories[category_name].iterations[iteration_index].status = new_status
            self._save_workspace(workspace)

    def get_all_iterations(self, workspace_id, category_name) -> List[Iteration]:
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            return workspace.categories[category_name].iterations

    def get_all_iterations_by_status(self, workspace_id, category_name, status: IterationStatus) -> \
            List[Tuple[Iteration, int]]:
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            return [(iteration, idx) for idx, iteration in enumerate(workspace.categories[category_name].iterations)
                    if iteration.status == status]

    def add_iteration_statistics(self, workspace_id, category_name, iteration_index, statistics_dict: dict):
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            iteration = workspace.categories[category_name].iterations[iteration_index]
            iteration.iteration_statistics.update(statistics_dict)
            self._save_workspace(workspace)

    def update_model_status(self, workspace_id: str, category_name: str, iteration_index: int, new_status: ModelStatus):
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            iterations = workspace.categories[category_name].iterations
            assert len(iterations) > iteration_index,\
                f"Iteration '{iteration_index}' doesn't exist in workspace '{workspace_id}'"
            iterations[iteration_index].model.model_status = new_status
            self._save_workspace(workspace)

    def mark_iteration_model_as_deleted(self, workspace_id, category_name, iteration_index):
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            iteration = self.get_all_iterations(workspace_id, category_name)[iteration_index]
            iteration.model.model_status = ModelStatus.DELETED
            iteration.status = IterationStatus.MODEL_DELETED
            self._save_workspace(workspace)
