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
from label_sleuth.active_learning.strategies.hard_example_mining import HardMiningLearner
from label_sleuth.active_learning.strategies.random_sampling import RandomSampling
from label_sleuth.active_learning.strategies.retrospective import RetrospectiveLearner


class ActiveLearningCatalog:
    RANDOM = ActiveLearningStrategy(RandomSampling)
    HARD_MINING = ActiveLearningStrategy(HardMiningLearner)
    RETROSPECTIVE = ActiveLearningStrategy(RetrospectiveLearner)
