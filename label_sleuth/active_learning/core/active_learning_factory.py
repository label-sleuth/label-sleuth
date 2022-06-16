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

from label_sleuth.active_learning.core.active_learning_strategies import ActiveLearningStrategies


class ActiveLearningFactory(object):
    def __init__(self):
        self.active_learners = {}

    def get_active_learner(self, active_learning_strategy: ActiveLearningStrategies):
        """
        Returns an instance of an active learning module, one that implements the methods in the ActiveLearner class.
        """
        if active_learning_strategy not in self.active_learners:
            if active_learning_strategy == ActiveLearningStrategies.RANDOM:
                from label_sleuth.active_learning.strategies.random_sampling import RandomSampling
                self.active_learners[active_learning_strategy] = RandomSampling()
            elif active_learning_strategy == ActiveLearningStrategies.HARD_MINING:
                from label_sleuth.active_learning.strategies.hard_example_mining import HardMiningLearner
                self.active_learners[active_learning_strategy] = HardMiningLearner()
            elif active_learning_strategy == ActiveLearningStrategies.RETROSPECTIVE:
                from label_sleuth.active_learning.strategies.retrospective import RetrospectiveLearner
                self.active_learners[active_learning_strategy] = RetrospectiveLearner()

        if active_learning_strategy not in self.active_learners:
            raise Exception(f"Failed to instantiate active learning strategy of type {active_learning_strategy}")
        return self.active_learners[active_learning_strategy]
