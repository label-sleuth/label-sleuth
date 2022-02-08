import json
import os
import logging
from dataclasses import dataclass
from typing import List

import dacite

from lrtc_lib.active_learning.core.active_learning_strategies import ActiveLearningStrategies
from lrtc_lib.definitions import ROOT_DIR
from lrtc_lib.models.core.model_policies import ModelPolicies, ModelPolicy
from lrtc_lib.training_set_selector.train_set_selector_api import TrainingSetSelectionStrategy


# based on https://tech.preferred.jp/en/blog/working-with-configuration-in-python/

# FIRST_MODEL_MIN_POSITIVE_THRESHOLD = 5
# CHANGED_ELEMENTS_THRESHOLD = 5
# SYNC_MODE_ELEMENTS_TO_LABEL = 200
# INFO_GAIN_STOP_WORDS = 'english'
# SHOW_TRANSLATION = False
# MODEL_POLICY = ModelPolicy(ModelTypesInternal.M_SVM)
# TRAINING_SET_SELECTION_STRATEGY = TrainingSetSelectionStrategy.ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_X2_RATIO
# ACTIVE_LEARNING_STRATEGY = ActiveLearningStrategies.HARD_MINING


@dataclass
class Configuration:
    first_model_positive_threshold: int
    changed_element_threshold: int
    sync_mode_elements_to_label: int
    info_gain_stop_words: str
    show_translation: bool
    model_policy: ModelPolicy
    training_set_selection_strategy: TrainingSetSelectionStrategy
    active_learning_strategy: ActiveLearningStrategies
    local_finetune: bool
    users: List[dict]
    precision_evaluation_size: int


converters = {
    ModelPolicy: lambda x: getattr(ModelPolicies, x),
    TrainingSetSelectionStrategy: lambda x: getattr(TrainingSetSelectionStrategy, x),
    ActiveLearningStrategies: lambda x: getattr(ActiveLearningStrategies, x)
}


def load_config():
    # If this code is executed without an exception then we have a valid Configuration object
    with open(os.path.join(ROOT_DIR, 'config.json'),) as f:
        raw_cfg = json.load(f)

    config = dacite.from_dict(
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
