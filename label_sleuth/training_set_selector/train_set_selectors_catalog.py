from label_sleuth.data_access.core.data_structs import LabelType
from label_sleuth.training_set_selector.train_set_selectors import TrainSetSelectorAllLabeled, \
    TrainSetSelectorEnforcePositiveNegativeRatio


class TrainSetSelectorAllLabeledIncludeWeak(TrainSetSelectorAllLabeled):
    def __init__(self, data_access, background_jobs_manager):
        super().__init__(data_access, background_jobs_manager, label_types={LabelType.Standard, LabelType.Weak})

class TrainSetSelectorEqualRatio(TrainSetSelectorEnforcePositiveNegativeRatio):
    def __init__(self, data_access, background_jobs_manager):
        super().__init__(data_access, background_jobs_manager, label_types={LabelType.Standard},
                                                            required_negative_ratio=1)

class TrainSetSelectorX2NegativeRatio(TrainSetSelectorEnforcePositiveNegativeRatio):
    def __init__(self, data_access, background_jobs_manager):
        super().__init__(data_access, background_jobs_manager, label_types={LabelType.Standard},
                                                            required_negative_ratio=2)

class TrainSetSelectorX10NegativeRatio(TrainSetSelectorEnforcePositiveNegativeRatio):
    def __init__(self, data_access, background_jobs_manager):
        super().__init__(data_access, background_jobs_manager, label_types={LabelType.Standard},
                                                            required_negative_ratio=10)


class TrainSetSelectorEqualRatioIncludeWeak(TrainSetSelectorEnforcePositiveNegativeRatio):
    def __init__(self, data_access, background_jobs_manager):
        super().__init__(data_access, background_jobs_manager, label_types={LabelType.Standard, LabelType.Weak},
                         required_negative_ratio=1)


class TrainSetSelectorX2NegativeRatioIncludeWeak(TrainSetSelectorEnforcePositiveNegativeRatio):
    def __init__(self, data_access, background_jobs_manager):
        super().__init__(data_access, background_jobs_manager, label_types={LabelType.Standard, LabelType.Weak},
                         required_negative_ratio=2)


class TrainSetSelectorX10NegativeRatioIncludeWeak(TrainSetSelectorEnforcePositiveNegativeRatio):
    def __init__(self, data_access, background_jobs_manager):
        super().__init__(data_access, background_jobs_manager, label_types={LabelType.Standard, LabelType.Weak},
                         required_negative_ratio=10)


class TrainSetSelectorsCatalog:
    """
    Given the current set of elements labeled by the user, a TrainingSetSelectionStrategy determines which examples
    will be sent in practice to the model at training time. For example, the strategy may specify that additional
    _unlabeled_ elements will be given to the model as weak negative examples.
    """
    ALL_LABELED = TrainSetSelectorAllLabeled
    ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_EQUAL_RATIO = TrainSetSelectorEqualRatio
    ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_X2_RATIO = TrainSetSelectorX2NegativeRatio
    ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_X10_RATIO = TrainSetSelectorX10NegativeRatio
    ALL_LABELED_INCLUDE_WEAK = TrainSetSelectorAllLabeledIncludeWeak
    ALL_LABELED_INCLUDE_WEAK_PLUS_UNLABELED_AS_NEGATIVE_EQUAL_RATIO = TrainSetSelectorEqualRatioIncludeWeak
    ALL_LABELED_INCLUDE_WEAK_PLUS_UNLABELED_AS_NEGATIVE_X2_RATIO = TrainSetSelectorX2NegativeRatioIncludeWeak
    ALL_LABELED_INCLUDE_WEAK_PLUS_UNLABELED_AS_NEGATIVE_X10_RATIO = TrainSetSelectorX10NegativeRatioIncludeWeak
