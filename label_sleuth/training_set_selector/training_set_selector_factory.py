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
import logging
import threading
from dataclasses import dataclass

from label_sleuth.data_access.core.data_structs import LabelType
from label_sleuth.data_access.data_access_api import DataAccessApi
from label_sleuth.training_set_selector.train_set_selectors import TrainSetSelectorAllLabeled, \
    TrainSetSelectorEnforcePositiveNegativeRatio
from label_sleuth.training_set_selector.train_set_selector_api import TrainingSetSelectionStrategy, TrainSetSelectorAPI
import inspect

class TrainingSetSelectionFactory:
    """
    Given a model type, this factory returns the relevant implementation of ModelAPI
    """
    def __init__(self, data_access: DataAccessApi):
        self.loaded_strategies = {}
        self.strategy_parameters = StrategyParameters(data_access=data_access, label_types=frozenset({LabelType.Standard}),
                                                      required_negative_ratio=1)
        self.lock = threading.RLock()

    def get_strategy(self, strategy_type: TrainingSetSelectionStrategy) -> TrainSetSelectorAPI:
        with self.lock:
            if strategy_type not in self.loaded_strategies:
                try:
                    # check which of the model dependencies are used by this model implementation
                    strategy_input_args = inspect.signature(strategy_type.cls).parameters.keys()

                    kwargs = {k: v for k, v in self.strategy_parameters.__dict__.items() if k in strategy_input_args}
                    # instantiate the model
                    strategy_api = strategy_type.cls(**kwargs)
                    self.loaded_strategies[strategy_type] = strategy_api
                except Exception:
                    logging.exception(f"Could not get strategy type {strategy_type.cls} from the model factory")

        return self.loaded_strategies[strategy_type]


@dataclass
class StrategyParameters:
    """
    These are the parameters that can be passed to the strategy's init method by the StrategyFactory. Strategy implementations
    can use some or all of these parameters (as needed) as keyword arguments for initialization.
    """
    data_access: DataAccessApi
    label_types: frozenset({LabelType.Standard})
    required_negative_ratio: int

def get_training_set_selector(data_access: DataAccessApi, strategy=TrainingSetSelectionStrategy.ALL_LABELED):
    if strategy == TrainingSetSelectionStrategy.ALL_LABELED:
        return TrainSetSelectorAllLabeled(data_access, label_types={LabelType.Standard})
    elif strategy == TrainingSetSelectionStrategy.ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_EQUAL_RATIO:
        return TrainSetSelectorEnforcePositiveNegativeRatio(data_access, label_types={LabelType.Standard},
                                                            required_negative_ratio=1)
    elif strategy == TrainingSetSelectionStrategy.ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_X2_RATIO:
        return TrainSetSelectorEnforcePositiveNegativeRatio(data_access, label_types={LabelType.Standard},
                                                            required_negative_ratio=2)
    elif strategy == TrainingSetSelectionStrategy.ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_X10_RATIO:
        return TrainSetSelectorEnforcePositiveNegativeRatio(data_access, label_types={LabelType.Standard},
                                                            required_negative_ratio=10)
    elif strategy == TrainingSetSelectionStrategy.ALL_LABELED_INCLUDE_WEAK:
        return TrainSetSelectorAllLabeled(data_access, label_types={LabelType.Standard, LabelType.Weak})
    elif strategy == TrainingSetSelectionStrategy.ALL_LABELED_INCLUDE_WEAK_PLUS_UNLABELED_AS_NEGATIVE_EQUAL_RATIO:
        return TrainSetSelectorEnforcePositiveNegativeRatio(data_access,
                                                            label_types={LabelType.Standard, LabelType.Weak},
                                                            required_negative_ratio=1)
    elif strategy == TrainingSetSelectionStrategy.ALL_LABELED_INCLUDE_WEAK_PLUS_UNLABELED_AS_NEGATIVE_X2_RATIO:
        return TrainSetSelectorEnforcePositiveNegativeRatio(data_access,
                                                            label_types={LabelType.Standard, LabelType.Weak},
                                                            required_negative_ratio=2)
    elif strategy == TrainingSetSelectionStrategy.ALL_LABELED_INCLUDE_WEAK_PLUS_UNLABELED_AS_NEGATIVE_X10_RATIO:
        return TrainSetSelectorEnforcePositiveNegativeRatio(data_access,
                                                            label_types={LabelType.Standard, LabelType.Weak},
                                                            required_negative_ratio=10)

    else:
        raise Exception(f"{strategy} is not supported")
