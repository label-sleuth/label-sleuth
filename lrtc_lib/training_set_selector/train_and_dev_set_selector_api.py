# (c) Copyright IBM Corporation 2020.

# LICENSE: Apache License 2.0 (Apache-2.0)
# http://www.apache.org/licenses/LICENSE-2.0

import abc
from typing import Tuple, Sequence

from lrtc_lib.data_access.core.data_structs import TextElement


class TrainAndDevSetSelector(object):
    def __init__(self, name):
        self.name = name

    def __eq__(self, other):
        if isinstance(other, TrainAndDevSetSelector):
            return self.name == other.name
        else:
            raise TypeError(f"comparing {other.__class__} to TrainAndDevSetSelector is not allowed! ")

    def __ne__(self, other):
        return not self.__eq__(other)

    def __hash__(self):
        return hash(self.name)


class TrainingSetSelectionStrategy(object):
    ALL_LABELED = TrainAndDevSetSelector("ALL_LABELED")
    ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_EQUAL_RATIO = \
        TrainAndDevSetSelector("ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_EQUAL_RATIO")
    ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_X2_RATIO = \
        TrainAndDevSetSelector("ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_X2_RATIO")
    ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_X10_RATIO = \
        TrainAndDevSetSelector("ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_X10_RATIO")


class TrainAndDevSetsSelectorAPI(object, metaclass=abc.ABCMeta):
    @abc.abstractmethod
    def get_train_and_dev_sets(self, workspace_id: str, train_dataset_name: str, category_name: str,
                               dev_dataset_name=None) -> Tuple[Sequence[TextElement], Sequence[TextElement]]:
        """
        For a given workspace, dataset and category, prepare train and dev sets and return them.
        Returns a tuple with the format: train_data, dev_data
        where "data" is a list of TextElement objects (containing labels for the category, and possibly metadata about
        some of these labels).

        :param workspace_id:
        :param train_dataset_name:
        :param category_name:
        :param dev_dataset_name:
        """
        raise NotImplementedError('get_train_and_dev_sets is not implemented in abstract class')
