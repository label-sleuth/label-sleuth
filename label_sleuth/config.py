#
#  Copyright (c) 2022 IBM Corp.
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#  http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#

import json

from dataclasses import dataclass, field
from typing import List

import dacite

from label_sleuth.active_learning.core.active_learning_api import ActiveLearningStrategy
from label_sleuth.active_learning.core.catalog import ActiveLearningCatalog
from label_sleuth.models.core.languages import Language, Languages
from label_sleuth.models.core.model_policies import ModelPolicies
from label_sleuth.models.policy.model_policy import ModelPolicy
from label_sleuth.training_set_selector.train_set_selector_api import TrainingSetSelectionStrategy


@dataclass
class Configuration:
    first_model_positive_threshold: int
    changed_element_threshold: int
    model_policy: ModelPolicy
    training_set_selection_strategy: TrainingSetSelectionStrategy
    active_learning_strategy: ActiveLearningStrategy
    precision_evaluation_size: int
    apply_labels_to_duplicate_texts: bool
    language: Language
    login_required: bool
    main_panel_elements_per_page: int = 500
    sidebar_panel_elements_per_page: int = 50
    users: List[dict] = field(default_factory=list)


converters = {
    ModelPolicy: lambda x: getattr(ModelPolicies, x),
    TrainingSetSelectionStrategy: lambda x: getattr(TrainingSetSelectionStrategy, x),
    ActiveLearningStrategy: lambda x: getattr(ActiveLearningCatalog, x),
    Language: lambda x: getattr(Languages, x)
}


def load_config(config_path) -> Configuration:
    # If this code is executed without an exception then we have a valid Configuration object
    with open(config_path) as f:
        raw_cfg = json.load(f)

    config = dacite.from_dict(
        data_class=Configuration, data=raw_cfg,
        config=dacite.Config(type_hooks=converters),
    )
    return config
