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

import abc

from label_sleuth.active_learning.core.active_learning_api import ActiveLearningStrategy


class ActiveLearningPolicy(object, metaclass=abc.ABCMeta):
    """
    Base class for implementing an active learning policy, that determines which type of active learning strategy
    will be used. Policies can be static, i.e. always return the same active learning strategy,
    or dynamic, i.e. a different active learning strategy is returned
    depending on the current iteration.
    """

    @abc.abstractmethod
    def get_active_learning_strategy(self, iteration_num: int) -> ActiveLearningStrategy:
        """
        Given *iteration_num*, return the type of active learning strategy to be used
        :param iteration_num:
        :return: An instance of ActiveLearningStrategy
        """

    @abc.abstractmethod
    def get_name(self) -> str:
        """
        :return: a name that describes the policy
        """
