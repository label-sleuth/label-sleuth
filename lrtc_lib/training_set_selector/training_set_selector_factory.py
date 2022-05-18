from lrtc_lib.data_access.data_access_api import DataAccessApi
from lrtc_lib.training_set_selector.train_set_selectors import TrainSetSelectorAllLabeled, \
    TrainSetSelectorEnforcePositiveNegativeRatio
from lrtc_lib.training_set_selector.train_set_selector_api import TrainingSetSelectionStrategy


def get_training_set_selector(data_access: DataAccessApi, strategy=TrainingSetSelectionStrategy.ALL_LABELED):
    if strategy == TrainingSetSelectionStrategy.ALL_LABELED:
        return TrainSetSelectorAllLabeled(data_access)
    elif strategy == TrainingSetSelectionStrategy.ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_EQUAL_RATIO:
        return TrainSetSelectorEnforcePositiveNegativeRatio(data_access, required_negative_ratio=1)
    elif strategy == TrainingSetSelectionStrategy.ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_X2_RATIO:
        return TrainSetSelectorEnforcePositiveNegativeRatio(data_access, required_negative_ratio=2)
    elif strategy == TrainingSetSelectionStrategy.ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_X10_RATIO:
        return TrainSetSelectorEnforcePositiveNegativeRatio(data_access, required_negative_ratio=10)

    else:
        raise Exception(f"{strategy} is not supported")
