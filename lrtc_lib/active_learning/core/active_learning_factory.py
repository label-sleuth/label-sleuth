from lrtc_lib.active_learning.core.active_learning_strategies import ActiveLearningStrategies


class ActiveLearningFactory(object):
    def __init__(self):
        self.active_learners = {}

    def get_active_learner(self, active_learning_strategy: ActiveLearningStrategies):
        """
        Returns an instance of an active learning module, one that implements the methods in the ActiveLearner class.
        """
        if active_learning_strategy not in self.active_learners:
            if active_learning_strategy == ActiveLearningStrategies.RANDOM:
                from lrtc_lib.active_learning.strategies.random_sampling import RandomSampling
                self.active_learners[active_learning_strategy] = RandomSampling()
            elif active_learning_strategy == ActiveLearningStrategies.HARD_MINING:
                from lrtc_lib.active_learning.strategies.hard_example_mining import HardMiningLearner
                self.active_learners[active_learning_strategy] = HardMiningLearner()
            elif active_learning_strategy == ActiveLearningStrategies.RETROSPECTIVE:
                from lrtc_lib.active_learning.strategies.retrospective import RetrospectiveLearner
                self.active_learners[active_learning_strategy] = RetrospectiveLearner()

        if active_learning_strategy not in self.active_learners:
            raise Exception(f"Failed to instantiate active learning strategy of type {active_learning_strategy}")
        return self.active_learners[active_learning_strategy]
