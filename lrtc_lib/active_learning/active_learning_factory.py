# (c) Copyright IBM Corporation 2020.

# LICENSE: Apache License 2.0 (Apache-2.0)
# http://www.apache.org/licenses/LICENSE-2.0

from lrtc_lib.active_learning.strategies import ActiveLearningStrategies


class ActiveLearningFactory(object):

    def get_active_learner(self, active_learning_strategy=ActiveLearningStrategies.RANDOM):
        from lrtc_lib.active_learning.core.strategy import base, retrospective, hard_example_mining, \
            perceptron_ensemble, perceptron_dropout

        active_learning_strategy = active_learning_strategy

        if active_learning_strategy == ActiveLearningStrategies.RANDOM:
            return base.RandomSampling()
        elif active_learning_strategy == ActiveLearningStrategies.HARD_MINING:
            return hard_example_mining.HardMiningLearner()  # a.k.a. uncertainty
        elif active_learning_strategy == ActiveLearningStrategies.RETROSPECTIVE:
            return retrospective.RetrospectiveLearner()
        elif active_learning_strategy == ActiveLearningStrategies.CORE_SET:
            return core_set.CoreSetLearner(max_to_consider=10**4)
        elif active_learning_strategy == ActiveLearningStrategies.GREEDY_CORE_SET:
            from lrtc_lib.active_learning.core.strategy import core_set
            return core_set.CoreSetLearner(greedy=True)
        elif active_learning_strategy == ActiveLearningStrategies.DAL:
            from lrtc_lib.active_learning.core.strategy import discriminative_representation_sampling
            return discriminative_representation_sampling.DiscriminativeRepresentationSampling()
        elif active_learning_strategy == ActiveLearningStrategies.DROPOUT_PERCEPTRON:
            return perceptron_dropout.PerceptronDropout(n_units=10)
        elif active_learning_strategy == ActiveLearningStrategies.PERCEPTRON_ENSEMBLE:
            return perceptron_ensemble.PerceptronEnsemble(n_units=10)
        else:
            return None
