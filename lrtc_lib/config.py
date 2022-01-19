import ast
import os
from dataclasses import dataclass
from typing import List

import dacite
import json
from configurations.BackendActiveLearningStrategy import BackendActiveLearningStrategy
from configurations.BackendModelPolicy import BackendModelPolicy
from configurations.BackendTrainAndDevSetSelector import BackendTrainAndDevSetSelector
import logging

# based on https://tech.preferred.jp/en/blog/working-with-configuration-in-python/

# FIRST_MODEL_MIN_POSITIVE_THRESHOLD = 5
# CHANGED_ELEMENTS_THRESHOLD = 5
# SYNC_MODE_ELEMENTS_TO_LABEL = 200
# INFO_GAIN_STOP_WORDS = 'english'
# SHOW_TRANSLATION = False
# MODEL_POLICY = ModelPolicy(ModelTypesInternal.M_SVM)
# TRAINING_SET_SELECTION_STRATEGY = TrainingSetSelectionStrategy.ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_X2_RATIO
# ACTIVE_LEARNING_STRATEGY = ActiveLearningStrategies.HARD_MINING
# LOCAL_FINETUNE = False
from lrtc_lib.definitions import ROOT_DIR


@dataclass
class Configuration:
    first_model_positive_threshold: int
    changed_element_threshold: int
    sync_mode_elements_to_label: int
    info_gain_stop_words: str
    show_translation: bool
    backend_model_policy: BackendModelPolicy
    backend_training_set_selection_strategy: BackendTrainAndDevSetSelector
    backend_active_learning_strategy: BackendActiveLearningStrategy
    local_finetune: bool
    users: List[dict]
    precision_evaluation_size: int
    precision_evaluation_filter: str

converters = {
    BackendModelPolicy: lambda x: BackendModelPolicy[x],
    BackendTrainAndDevSetSelector: lambda x: BackendTrainAndDevSetSelector[x],
    BackendActiveLearningStrategy: lambda x: BackendActiveLearningStrategy[x]
}

def load_config():
    #If this code is executed without an exception then we have a valid Configuration object
    with open(os.path.join(ROOT_DIR,'config.json'),) as f:
        raw_cfg = json.load(f)

    config =  dacite.from_dict(
        data_class=Configuration, data=raw_cfg,
        config=dacite.Config(type_hooks=converters),
    )
    logging.info(f"loaded configurations: {config}")
    return config


CONFIGURATION = load_config()

if __name__ == '__main__':
    for user in CONFIGURATION.users:
        print(f"{user}")
    print(CONFIGURATION.precision_evaluation_size)