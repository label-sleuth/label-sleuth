# (c) Copyright IBM Corporation 2020.

# LICENSE: Apache License 2.0 (Apache-2.0)
# http://www.apache.org/licenses/LICENSE-2.0

from lrtc_lib.train_and_infer_service.model_type import ModelTypes


class ActiveLearningStrategy(object):

    def __init__(self, name):
        self.name = name

    def __eq__(self, other):
        if isinstance(other, ActiveLearningStrategy):
            return self.name == other.name
        else:
            raise TypeError(f"comparing {other.__class__} to ActiveLearningStrategy is not allowed! ")

    def __ne__(self, other):
        return not self.__eq__(other)

    def __hash__(self):
        return hash(self.name)


class ActiveLearningStrategies(object): #TODO keep only they important strategies
    RANDOM = ActiveLearningStrategy("RANDOM")
    HARD_MINING = ActiveLearningStrategy("HARD_MINING")
    RETROSPECTIVE = ActiveLearningStrategy("RETROSPECTIVE")
    CORE_SET = ActiveLearningStrategy("CORE_SET")
    GREEDY_CORE_SET = ActiveLearningStrategy("GREEDY_CORE_SET")
    DAL = ActiveLearningStrategy("DAL")
    DROPOUT_PERCEPTRON = ActiveLearningStrategy("DROPOUT_PERCEPTRON")
    PERCEPTRON_ENSEMBLE = ActiveLearningStrategy("PERCEPTRON_ENSEMBLE")


def get_compatible_models(model_type, active_learning_strategy):
    all_models = ModelTypes.get_all_types()
    embedding_based_models = {ModelTypes.HFBERT}

    embedding_based_strategies = {ActiveLearningStrategies.CORE_SET, ActiveLearningStrategies.DAL,
                                  ActiveLearningStrategies.GREEDY_CORE_SET,
                                  ActiveLearningStrategies.DROPOUT_PERCEPTRON,
                                  ActiveLearningStrategies.PERCEPTRON_ENSEMBLE}

    if active_learning_strategy in embedding_based_strategies:
        return model_type in embedding_based_models
    else:
        return model_type in all_models
