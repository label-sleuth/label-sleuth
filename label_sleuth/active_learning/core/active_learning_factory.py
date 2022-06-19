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

from label_sleuth.active_learning.core.active_learning_api import ActiveLearningStrategy


class ActiveLearningFactory:
    def __init__(self):
        self.active_learners = {}

    def get_active_learner(self, active_learning_strategy: ActiveLearningStrategy):
        """
        Returns an instance of an active learning module, one that implements the methods in the ActiveLearner class.
        """
        if active_learning_strategy not in self.active_learners:
            try:
                active_learner = active_learning_strategy.cls()
                self.active_learners[active_learning_strategy] = active_learner
            except Exception:
                logging.exception(f"Could not get active learning strategy {active_learning_strategy.cls} from the "
                                  f"active learning factory")

        return self.active_learners[active_learning_strategy]
