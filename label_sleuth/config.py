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
import logging

from dataclasses import dataclass, field
from typing import List, Type

import dacite

from label_sleuth.active_learning.core.active_learning_api import ActiveLearningStrategy
from label_sleuth.active_learning.core.active_learning_policies import ActiveLearningPolicies
from label_sleuth.active_learning.core.catalog import ActiveLearningCatalog
from label_sleuth.active_learning.policy.active_learning_policy import ActiveLearningPolicy
from label_sleuth.models.core.languages import Language, Languages
from label_sleuth.models.core.model_policies import ModelPolicies
from label_sleuth.models.policy.model_policy import ModelPolicy
from label_sleuth.training_set_selector.train_set_selector_api import TrainSetSelectorAPI
from label_sleuth.training_set_selector.train_set_selectors_catalog import TrainSetSelectorsCatalog


@dataclass
class BinaryFlowConfiguration:
    first_model_positive_threshold: int
    first_model_negative_threshold: int
    changed_element_threshold: int
    precision_evaluation_size: int
    model_policy: ModelPolicy
    training_set_selection_strategy: Type[TrainSetSelectorAPI]
    active_learning_policy: ActiveLearningPolicy = None
    active_learning_strategy: ActiveLearningStrategy = None


@dataclass
class MultiClassFlowConfiguration:
    per_class_labeling_threshold: int
    changed_element_threshold: int
    accuracy_evaluation_size: int
    model_policy: ModelPolicy
    training_set_selection_strategy: Type[TrainSetSelectorAPI]
    active_learning_policy: ActiveLearningPolicy = None
    active_learning_strategy: ActiveLearningStrategy = None


@dataclass
class Configuration:
    binary_flow: BinaryFlowConfiguration
    multiclass_flow: MultiClassFlowConfiguration

    apply_labels_to_duplicate_texts: bool
    language: Language
    login_required: bool
    users: List[dict] = field(default_factory=list)

    max_document_name_length: int = 60
    main_panel_elements_per_page: int = 500
    sidebar_panel_elements_per_page: int = 50
    snippet_max_token_length: int = 100
    max_dataset_length: int = 3000000
    cpu_workers: int = 10


converters = {
    ModelPolicy: lambda x: getattr(ModelPolicies, x),
    Type[TrainSetSelectorAPI]: lambda x: getattr(TrainSetSelectorsCatalog, x),
    ActiveLearningStrategy: lambda x: getattr(ActiveLearningCatalog, x),
    ActiveLearningPolicy: lambda x: getattr(ActiveLearningPolicies, x),
    Language: lambda x: getattr(Languages, x.upper())
}


def load_config(config_path, command_line_args=None) -> Configuration:
    # If this code is executed without an exception then we have a valid Configuration object
    with open(config_path) as f:
        raw_cfg = json.load(f)

    # override config with user specified values
    if command_line_args:
        for arg, value in command_line_args.items():
            if value is None:
                continue

            if '.' in arg:
                cfg_name, arg_name = arg.split('.')
                cfg_to_modify = raw_cfg[cfg_name]
            else:
                cfg_to_modify = raw_cfg
                arg_name = arg

            if arg_name in cfg_to_modify:
                logging.info(f"Overriding config file argument '{arg}' with a command line argument. "
                             f"Value changed from '{cfg_to_modify[arg_name]}' to '{value}'")
                cfg_to_modify[arg_name] = value

    binary_config = dacite.from_dict(
        data_class=BinaryFlowConfiguration, data=raw_cfg.pop('binary_flow'),
        config=dacite.Config(type_hooks=converters),
    )

    multiclass_config = dacite.from_dict(
        data_class=MultiClassFlowConfiguration, data=raw_cfg.pop('multiclass_flow'),
        config=dacite.Config(type_hooks=converters),
    )

    for flow_config in [binary_config, multiclass_config]:
        if flow_config.active_learning_strategy is None and flow_config.active_learning_policy is None:
            raise Exception("Either active_learning_strategy or active_learning_policy must be specified")

        if flow_config.active_learning_strategy is not None and flow_config.active_learning_policy is not None:
            raise Exception("Only one of active_learning_strategy or active_learning_policy can be specified")

    config = dacite.from_dict(
        data_class=Configuration, data={**raw_cfg,
                                        'binary_flow': binary_config,
                                        'multiclass_flow': multiclass_config},
        config=dacite.Config(type_hooks=converters),
    )

    return config
