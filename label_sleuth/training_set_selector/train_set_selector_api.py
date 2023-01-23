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

from enum import Enum
from typing import Sequence, Set, Iterable

from label_sleuth.data_access.core.data_structs import TextElement, LabelType


class TrainingSetSelectionStrategy(Enum):
    """
    Given the current set of elements labeled by the user, a TrainingSetSelectionStrategy determines which examples
    will be sent in practice to the model at training time. For example, the strategy may specify that additional
    _unlabeled_ elements will be given to the model as weak negative examples.
    """
    ALL_LABELED = 0
    ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_EQUAL_RATIO = 1
    ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_X2_RATIO = 2
    ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_X10_RATIO = 3
    ALL_LABELED_INCLUDE_WEAK = 4
    ALL_LABELED_INCLUDE_WEAK_PLUS_UNLABELED_AS_NEGATIVE_EQUAL_RATIO = 5
    ALL_LABELED_INCLUDE_WEAK_PLUS_UNLABELED_AS_NEGATIVE_X2_RATIO = 6
    ALL_LABELED_INCLUDE_WEAK_PLUS_UNLABELED_AS_NEGATIVE_X10_RATIO = 7


class TrainSetSelectorAPI(object, metaclass=abc.ABCMeta):

    def __init__(self, data_access, label_types=frozenset({LabelType.Standard})):
        self.data_access = data_access
        self.label_types = label_types

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

    def get_label_types(self) -> Iterable[LabelType]:
        """
        Return the types of labels this selector is using
        """
        return self.label_types
