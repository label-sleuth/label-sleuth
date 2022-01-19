from enum import Enum

from lrtc_lib.training_set_selector.train_and_dev_set_selector_api import \
    TrainingSetSelectionStrategy


class BackendTrainAndDevSetSelector(Enum):
    ALL_LABELED = TrainingSetSelectionStrategy.ALL_LABELED
    ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_X2_RATIO = TrainingSetSelectionStrategy.\
        ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_X2_RATIO
    ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_X10_RATIO = TrainingSetSelectionStrategy.\
        ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_X10_RATIO