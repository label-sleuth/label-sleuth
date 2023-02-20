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
from label_sleuth.active_learning.core.active_learning_api import ActiveLearningStrategy
from label_sleuth.active_learning.policy.active_learning_policy import ActiveLearningPolicy


class StaticActiveLearningPolicy(ActiveLearningPolicy):
    """
    A simple policy that is initialized using a specific classification active learning strategy and always returns
    this strategy.
    """

    def __init__(self, active_learning_strategy: ActiveLearningStrategy):
        self.static_active_learning_strategy = active_learning_strategy

    def get_active_learning_strategy(self, iteration_num: int) -> ActiveLearningStrategy:
        """
        Ignores *iteration_num* and returns the active learning strategy defined in the initialization
        """
        return self.static_active_learning_strategy

    def get_name(self):
        return f'Static-{self.static_active_learning_strategy.name}'
