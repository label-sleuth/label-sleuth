import abc

from enum import Enum
from typing import Sequence

from lrtc_lib.data_access.core.data_structs import TextElement


class TrainingSetSelectionStrategy(Enum):
    """
    Given the current set of elements labeled by the user, a TrainingSetSelectionStrategy determines which examples
    will be sent in practice to the model at training time. For example, additional _unlabeled_ elements may be given
    to the model as weak negative examples.
    """
    ALL_LABELED = 0
    ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_EQUAL_RATIO = 1
    ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_X2_RATIO = 2
    ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_X10_RATIO = 3


class TrainSetSelectorAPI(object, metaclass=abc.ABCMeta):
    @abc.abstractmethod
    def get_train_set(self, workspace_id: str, train_dataset_name: str, category_name: str) -> Sequence[TextElement]:
        """
        For a given workspace, dataset and category, prepare and return a train set for training the model.
        Returns a list of TextElement objects (containing labels for the category, and possibly metadata about
        some of these labels).

        :param workspace_id:
        :param train_dataset_name:
        :param category_name:
        """
