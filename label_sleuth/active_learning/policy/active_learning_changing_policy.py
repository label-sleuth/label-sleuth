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

from typing import List

import numpy as np

from label_sleuth.active_learning.core.active_learning_api import ActiveLearningStrategy
from label_sleuth.active_learning.policy.active_learning_policy import ActiveLearningPolicy


class ActiveLearningChangingPolicy(ActiveLearningPolicy):
    """
    A dynamic active learning policy that follows a predefined pattern of switching between active learning strategies
    after a certain number of iterations.
    """

    def __init__(self, active_learning_strategies: List[ActiveLearningStrategy],
                 num_iterations_per_strategy: List[int]):
        """
        :param active_learning_strategies: a list of the N strategies to be used by the policy
        :param num_iterations_per_strategy: a corresponding list specifying the number of iterations for each of the
        first N-1 strategies to be used; the Nth strategy type will be used for all subsequent iterations.
        For example, if there are 3 strategies, and num_iterations_per_strategy=[5, 2], then strategy A will be used for
        iterations 0-4, strategy B for iterations 5-6, and strategy C from iteration 7 onwards.
        """
        if len(active_learning_strategies) != len(num_iterations_per_strategy) + 1:
            raise Exception(
                f"The number of strategies provided ({len(active_learning_strategies)}) does not match the provided "
                f"list of {len(num_iterations_per_strategy)} active learning strategy switch points. "
                f"For each active learning type, except the last one, the number of iterations for this active "
                f"learning strategy to be used must be specified.")
        self.active_learning_strategies = active_learning_strategies
        self.num_iterations_per_strategy = num_iterations_per_strategy
        self.switch_points = np.cumsum(num_iterations_per_strategy)

    def get_active_learning_strategy(self, iteration_num: int) -> ActiveLearningStrategy:
        for active_learning_strategy, switch_point in zip(self.active_learning_strategies, self.switch_points):
            if iteration_num < switch_point:
                return active_learning_strategy
        return self.active_learning_strategies[-1]

    def get_name(self):
        name = ""
        for active_learning_strategy, n_iter in zip(self.active_learning_strategies, self.num_iterations_per_strategy):
            name += f'{active_learning_strategy.name}x{n_iter}-'
        name += f"{self.active_learning_strategies[-1].name}"
        return name
