from lrtc_lib.training_set_selector.train_set_selectors import TrainSetSelectorAllLabeled, \
    TrainSetSelectorAllLabeledPlusUnlabeledAsWeakNegative
from lrtc_lib.training_set_selector.train_set_selector_api import TrainingSetSelectionStrategy


def get_training_set_selector(selector=TrainingSetSelectionStrategy.ALL_LABELED):
    if selector == TrainingSetSelectionStrategy.ALL_LABELED:
        return TrainSetSelectorAllLabeled()
    elif selector == TrainingSetSelectionStrategy.ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_EQUAL_RATIO:
        return TrainSetSelectorAllLabeledPlusUnlabeledAsWeakNegative(negative_ratio=1)
    elif selector == TrainingSetSelectionStrategy.ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_X2_RATIO:
        return TrainSetSelectorAllLabeledPlusUnlabeledAsWeakNegative(negative_ratio=2)
    elif selector == TrainingSetSelectionStrategy.ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_X10_RATIO:
        return TrainSetSelectorAllLabeledPlusUnlabeledAsWeakNegative(negative_ratio=10)

    else:
        raise Exception(f"{selector} is not supported")
