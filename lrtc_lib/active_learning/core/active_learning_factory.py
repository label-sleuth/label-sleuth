from lrtc_lib.active_learning.core.active_learning_strategies import ActiveLearningStrategies


class ActiveLearningFactory(object):
    def __init__(self):
        self.active_learners = {}

    def get_active_learner(self, active_learning_strategy):
        from lrtc_lib.active_learning.strategies import base, hard_example_mining, \
            perceptron_ensemble, perceptron_dropout, retrospective
        if active_learning_strategy not in self.active_learners:
            if active_learning_strategy == ActiveLearningStrategies.RANDOM:
                self.active_learners[active_learning_strategy] = base.RandomSampling()
            elif active_learning_strategy == ActiveLearningStrategies.HARD_MINING:
                self.active_learners[active_learning_strategy] = hard_example_mining.HardMiningLearner()  # a.k.a. uncertainty
            elif active_learning_strategy == ActiveLearningStrategies.RETROSPECTIVE:
                self.active_learners[active_learning_strategy] = retrospective.RetrospectiveLearner()
            elif active_learning_strategy == ActiveLearningStrategies.DAL:
                from lrtc_lib.active_learning.strategies import discriminative_representation_sampling
                self.active_learners[active_learning_strategy] = discriminative_representation_sampling.DiscriminativeRepresentationSampling()
            elif active_learning_strategy == ActiveLearningStrategies.DROPOUT_PERCEPTRON:
                self.active_learners[active_learning_strategy] = perceptron_dropout.PerceptronDropout(n_units=10)
            elif active_learning_strategy == ActiveLearningStrategies.PERCEPTRON_ENSEMBLE:
                self.active_learners[active_learning_strategy] = perceptron_ensemble.PerceptronEnsemble(n_units=10)

        if active_learning_strategy not in self.active_learners:
            raise Exception(f"Failed to instantiate active learning strategy of type {active_learning_strategy}")
        return self.active_learners[active_learning_strategy]

if __name__ == '__main__':
    factory = ActiveLearningFactory()
    factory.get_active_learner(ActiveLearningStrategies.BLA)