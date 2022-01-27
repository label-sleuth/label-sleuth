from enum import Enum

from lrtc_lib.models.core.model_types import ModelTypes


class ActiveLearningStrategies(Enum): #TODO keep only they important strategies
    RANDOM = 0
    HARD_MINING = 1
    RETROSPECTIVE = 2
    DAL = 3
    DROPOUT_PERCEPTRON = 4
    PERCEPTRON_ENSEMBLE = 5
    BLA = 6


def get_compatible_models(model_type, active_learning_strategy):
    all_models = ModelTypes.get_all_types()
    embedding_based_models = {ModelTypes.HF_BERT}

    embedding_based_strategies = {ActiveLearningStrategies.DAL,
                                  ActiveLearningStrategies.DROPOUT_PERCEPTRON,
                                  ActiveLearningStrategies.PERCEPTRON_ENSEMBLE}

    if active_learning_strategy in embedding_based_strategies:
        return model_type in embedding_based_models
    else:
        return model_type in all_models
