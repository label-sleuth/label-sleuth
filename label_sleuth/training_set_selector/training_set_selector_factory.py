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
import threading
import logging
from typing import Type

from label_sleuth.data_access.data_access_api import DataAccessApi
from label_sleuth.orchestrator.background_jobs_manager import BackgroundJobsManager
from label_sleuth.training_set_selector.train_set_selector_api import TrainSetSelectorAPI


class TrainingSetSelectionFactory:
    """
    Given a model type, this factory returns the relevant implementation of ModelAPI
    """
    def __init__(self, data_access: DataAccessApi, background_jobs_manager: BackgroundJobsManager):
        self.loaded_strategies = {}
        self.data_access = data_access
        self.background_jobs_manager = background_jobs_manager
        self.lock = threading.RLock()

    def get_training_set_selector(self, strategy_type: Type[TrainSetSelectorAPI]) -> TrainSetSelectorAPI:
        with self.lock:
            if strategy_type not in self.loaded_strategies:
                try:
                    strategy_api = strategy_type(self.data_access, self.background_jobs_manager)
                    self.loaded_strategies[strategy_type] = strategy_api
                except Exception:
                    logging.exception(f"Could not get strategy type {strategy_type} from the training set selection"
                                      f" factory")

        return self.loaded_strategies[strategy_type]