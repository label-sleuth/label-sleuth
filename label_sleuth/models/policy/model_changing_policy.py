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

from label_sleuth.models.core.model_type import ModelType
from label_sleuth.models.policy.model_policy import ModelPolicy


class ModelChangingPolicy(ModelPolicy):
    """
    A dynamic model policy that follows a predefined pattern of switching between model types after a certain number of
    iterations, e.g. for the first 3 iterations use ModelTypes.NB_OVER_BOW, then switch to using ModelTypes.HF_BERT
    """

    def __init__(self, model_types: List[ModelType], num_iterations_per_model: List[int]):
        """
        :param model_types: a list of the N model types to be used by the policy
        :param num_iterations_per_model: a corresponding list specifying the number of iterations for each of the
        first N-1 models to be used; the Nth model type will be used for all subsequent iterations.
        For example, if there are 3 model types, and num_iterations_per_model=[5, 2], then type A will be used for
        iterations 0-4, type B for iterations 5-6, and type C from iteration 7 onwards.
        """
        if len(model_types) != len(num_iterations_per_model) + 1:
            raise Exception(
                f"The number of model types provided ({len(model_types)}) does not match the provided list of "
                f"{len(num_iterations_per_model)} model switch points. For each model type, except the last one, "
                f"the number of iterations for this model type to be used must be specified.")
        self.model_types = model_types
        self.num_iterations_per_model = num_iterations_per_model
        self.switch_points = np.cumsum(num_iterations_per_model)

    def get_model_type(self, iteration_num: int) -> ModelType:
        for model_type, switch_point in zip(self.model_types, self.switch_points):
            if iteration_num < switch_point:
                return model_type
        return self.model_types[-1]

    def get_all_model_types(self):
        return set(self.model_types)

    def get_name(self):
        name = ""
        for model_type, n_iter in zip(self.model_types, self.num_iterations_per_model):
            name += f'{model_type.name}x{n_iter}-'
        name += f"{self.model_types[-1].name}"
        return name
