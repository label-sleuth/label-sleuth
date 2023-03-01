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

import abc

from concurrent.futures import Future
from typing import Sequence, Set

from label_sleuth.data_access.core.data_structs import TextElement, LabelType
from label_sleuth.orchestrator.background_jobs_manager import BackgroundJobsManager



class TrainSetSelectorAPI(object, metaclass=abc.ABCMeta):

    def __init__(self, data_access, background_jobs_manager: BackgroundJobsManager, gpu_support=False,
                 label_types=frozenset({LabelType.Standard})):
        self.data_access = data_access
        self.label_types = label_types
        self.background_jobs_manager = background_jobs_manager
        self.gpu_support = gpu_support

    def collect_train_set(self, workspace_id: str, train_dataset_name: str, category_id: int, done_callback=None) \
            -> Future:
        future = self.background_jobs_manager.add_background_job(
            self.get_train_set, args=(workspace_id, train_dataset_name, category_id),
            use_gpu=self.gpu_support, done_callback=done_callback)
        return future

    @abc.abstractmethod
    def get_train_set(self, workspace_id: str, train_dataset_name: str, category_id: int) -> Sequence[TextElement]:
        """
        For a given workspace, dataset and category, prepare and return a train set for training the model.
        Returns a list of TextElement objects (containing labels for the category, and possibly metadata about
        some of these labels).

        :param workspace_id:
        :param train_dataset_name:
        :param category_id:
        """

    def get_label_types(self) -> Set[LabelType]:
        """
        Return the types of labels this selector is using
        """
        return set(self.label_types)
