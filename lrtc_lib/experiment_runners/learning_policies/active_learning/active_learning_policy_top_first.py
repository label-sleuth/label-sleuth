from lrtc_lib.active_learning.strategies import ActiveLearningStrategy
from sleuth_internal_lib.active_learning.strategies import ActiveLearningStrategiesInternal
from sleuth_internal_lib.experiment_runners.learning_policies.active_learning.active_learning_policy import \
    ActiveLearningPolicy


class ActiveLearningPolicyTopFirst(ActiveLearningPolicy):

    def get_active_learning_strategy(self, iteration_num: int) -> ActiveLearningStrategy:
        if iteration_num <= 2:
            al = ActiveLearningStrategiesInternal.RETROSPECTIVE
        else:
            al = ActiveLearningStrategiesInternal.HARD_MINING
        return al
