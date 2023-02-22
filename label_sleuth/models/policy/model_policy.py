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
from typing import Set

from label_sleuth.models.core.model_type import ModelType


class ModelPolicy(object, metaclass=abc.ABCMeta):
    """
    Base class for implementing a model policy, that determines which type of classification model will be used.
    Policies can be static, i.e. always return the same model type, or dynamic, i.e. a different model type is returned
    depending on the current iteration.
    """

    @abc.abstractmethod
    def get_model_type(self, iteration_num: int) -> ModelType:
        """
        Given *iteration_num*, return the type of classification model to be used
        :param iteration_num:
        :return: a member of the ModelTypes enum
        """

    @abc.abstractmethod
    def get_all_model_types(self) -> Set[ModelType]:
        """
        Return the types of all possible classification models to be used by this policy. Useful for checking that
        the policy is compatible with the overall system configuration.
        """

    @abc.abstractmethod
    def get_name(self) -> str:
        """
        :return: a name that describes the policy
        """
