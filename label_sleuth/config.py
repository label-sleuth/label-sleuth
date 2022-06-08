import json
import logging

from dataclasses import dataclass, field
from typing import List

import dacite

from label_sleuth.active_learning.core.active_learning_strategies import ActiveLearningStrategies
from label_sleuth.models.core.model_policies import ModelPolicies
from label_sleuth.models.policy.model_policy import ModelPolicy
from label_sleuth.training_set_selector.train_set_selector_api import TrainingSetSelectionStrategy



@dataclass
class Configuration:
    first_model_positive_threshold: int
    changed_element_threshold: int
    model_policy: ModelPolicy
    training_set_selection_strategy: TrainingSetSelectionStrategy
    active_learning_strategy: ActiveLearningStrategies
    precision_evaluation_size: int
    apply_labels_to_duplicate_texts: bool
    login_required: bool
    users: List[dict] = field(default_factory=list)


converters = {
    ModelPolicy: lambda x: getattr(ModelPolicies, x),
    TrainingSetSelectionStrategy: lambda x: getattr(TrainingSetSelectionStrategy, x),
    ActiveLearningStrategies: lambda x: getattr(ActiveLearningStrategies, x)
}


def load_config(config_path):
    # If this code is executed without an exception then we have a valid Configuration object
    with open(config_path) as f:
        raw_cfg = json.load(f)

    config = dacite.from_dict(
        data_class=Configuration, data=raw_cfg,
        config=dacite.Config(type_hooks=converters),
    )
    logging.info(f"loaded configuration: {config}")
    return config
