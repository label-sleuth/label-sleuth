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
import logging
from collections import defaultdict

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Sequence, Tuple, Mapping

import jsonpickle

from label_sleuth.models.core.model_api import ModelStatus
from label_sleuth.models.core.model_type import ModelType


class IterationStatus(Enum):
    PREPARING_DATA = -1  # negative numbering is due to backward compatibility issues
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
    train_statistics: dict


@dataclass
class Iteration:
    """
    This class stores information about an iteration. The flow of an iteration includes training a model,
    inferring the full corpus using this model, choosing candidate elements for labeling using active learning, as
    well as calculating various statistics. Each iteration is associated with a specific Category.
    """
    status: IterationStatus
    model: ModelInfo = None
    iteration_statistics: Dict = field(default_factory=dict)
    active_learning_recommendations: Sequence[str] = field(default_factory=list)


@dataclass
class Category:
    name: str
    id: int
    description: str
    label_change_count_since_last_train: int = 0
    iterations: List[Iteration] = field(default_factory=list)


@dataclass
class Workspace:
    workspace_id: str
    dataset_name: str
    categories: Dict[int, Category] = field(default_factory=dict)


class WorkspaceSchemeChangedException(Exception):
    def __init__(self, message):
        self.message = message


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
            try:
                return self._load_workspace(workspace_id)
            except Exception as e:
                raise WorkspaceSchemeChangedException(
                    f"Failed to load workspace {workspace_id}. This is probably due to an unhandled "
                    f"workspace scheme upgrade. Please open an issue on "
                    f"https://github.com/label-sleuth/label-sleuth/issues/new/choose for additional support") from e

    def get_all_categories(self, workspace_id) -> Mapping[int, Category]:
        return {category_id: category for category_id, category in
                self.get_workspace(workspace_id).categories.items() if category is not None}

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
            try:
                workspace = self.get_workspace(workspace_id)
            except WorkspaceSchemeChangedException:
                logging.warning(f"Failed to load workspace {workspace_id}. skipping...", exc_info=True)
                continue
            all_workspaces.append(workspace)
        return all_workspaces

    def _load_workspace(self, workspace_id) -> Workspace:
        cached_workspace = self.workspaces.get(workspace_id)
        if cached_workspace:
            return cached_workspace
        with open(os.path.join(self.workspace_dir, self._filename_from_workspace_id(workspace_id))) as json_file:
            workspace = json_file.read()
        workspace = jsonpickle.decode(workspace)
        # int dictionary keys are converted to string when writing to json, see https://bugs.python.org/issue34972
        workspace.categories = {int(category_id_str): category
                                for category_id_str, category in workspace.categories.items()}
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
            existing_category_names = [category.name for category in workspace.categories.values()
                                       if category is not None]
            if category_name in existing_category_names:
                raise Exception(f"Category '{category_name}' already exists in workspace '{workspace_id}'")
            category_id = len(workspace.categories)
            workspace.categories[category_id] = Category(name=category_name, description=category_description,
                                                         id=category_id)
            self._save_workspace(workspace)
            return category_id

    def edit_category(self, workspace_id: str, category_id: int, new_category_name: str, new_category_description: str):
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            workspace.categories[category_id].name = new_category_name
            workspace.categories[category_id].description = new_category_description

            self._save_workspace(workspace)
        return category_id

    def delete_category_from_workspace(self, workspace_id: str, category_id: int):
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            workspace.categories[category_id] = None
            self._save_workspace(workspace)

    def get_current_category_recommendations(self, workspace_id: str, category_id: int) -> Sequence[str]:
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            category = workspace.categories[category_id]

            for iteration in reversed(category.iterations):
                if iteration.status == IterationStatus.READY:
                    return iteration.active_learning_recommendations
            return []

    def update_category_recommendations(self, workspace_id: str, category_id: int, iteration_index: int,
                                        recommended_items: Sequence[str]):
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            workspace.categories[category_id].iterations[iteration_index].active_learning_recommendations \
                = recommended_items
            self._save_workspace(workspace)

    def get_label_change_count_since_last_train(self, workspace_id: str, category_id: int) -> int:
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            return workspace.categories[category_id].label_change_count_since_last_train

    def set_label_change_count_since_last_train(self, workspace_id: str, category_id: int, number_of_changes: int):
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            workspace.categories[category_id].label_change_count_since_last_train = number_of_changes
            self._save_workspace(workspace)

    def increase_label_change_count_since_last_train(self, workspace_id: str, category_id: int,
                                                     number_of_new_changes: int):
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            workspace.categories[category_id].label_change_count_since_last_train = \
                workspace.categories[category_id].label_change_count_since_last_train + number_of_new_changes
            self._save_workspace(workspace)

    # Iteration-related methods

    def add_iteration(self, workspace_id: str, category_id: int):
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            iteration = Iteration(status=IterationStatus.PREPARING_DATA)
            workspace.categories[category_id].iterations.append(iteration)
            self._save_workspace(workspace)

    def add_model(self, workspace_id: str, category_id: int, iteration_index: int, model_info: ModelInfo):
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            if workspace.categories[category_id].iterations[iteration_index].model is not None:
                raise Exception(f"Workspace '{workspace_id}' category '{category_id}' iteration {iteration_index} "
                                f"already has a model, cannot add a model")
            workspace.categories[category_id].iterations[iteration_index].model = model_info
            self._save_workspace(workspace)

    def get_iteration_status(self, workspace_id: str, category_id: int, iteration_index: int) -> IterationStatus:
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            return workspace.categories[category_id].iterations[iteration_index].status

    def update_iteration_status(self, workspace_id: str, category_id: int, iteration_index: int,
                                new_status: IterationStatus):
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            workspace.categories[category_id].iterations[iteration_index].status = new_status
            self._save_workspace(workspace)

    def get_all_iterations(self, workspace_id, category_id: int) -> List[Iteration]:
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            return workspace.categories[category_id].iterations

    def get_all_iterations_by_status(self, workspace_id: str, category_id: int, status: IterationStatus) -> \
            List[Tuple[Iteration, int]]:
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            return [(iteration, idx) for idx, iteration in enumerate(workspace.categories[category_id].iterations)
                    if iteration.status == status]

    def add_iteration_statistics(self, workspace_id, category_id: int, iteration_index: int, statistics_dict: dict):
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            iteration = workspace.categories[category_id].iterations[iteration_index]
            iteration.iteration_statistics.update(statistics_dict)
            self._save_workspace(workspace)

    def update_model_status(self, workspace_id: str, category_id: int, iteration_index: int, new_status: ModelStatus):
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            iterations = workspace.categories[category_id].iterations
            assert len(iterations) > iteration_index,\
                f"Iteration '{iteration_index}' doesn't exist in workspace '{workspace_id}'"
            iterations[iteration_index].model.model_status = new_status
            self._save_workspace(workspace)

    def mark_iteration_model_as_deleted(self, workspace_id, category_id: int, iteration_index: int):
        with self.workspaces_lock[workspace_id]:
            workspace = self._load_workspace(workspace_id)
            iteration = self.get_all_iterations(workspace_id, category_id)[iteration_index]
            iteration.model.model_status = ModelStatus.DELETED
            iteration.status = IterationStatus.MODEL_DELETED
            self._save_workspace(workspace)
