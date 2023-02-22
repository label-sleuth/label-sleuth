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

from label_sleuth.models.core.model_type import ModelType
from label_sleuth.models.policy.model_policy import ModelPolicy


class StaticModelPolicy(ModelPolicy):
    """
    A simple policy that is initialized using a specific classification model type and always returns this model type.
    """

    def __init__(self, model_type: ModelType = None):
        self.static_model = model_type

    def get_model_type(self, iteration_num: int) -> ModelType:
        """
        Ignores *iteration_num* and returns the model type defined in the initialization
        """
        model_type = self.static_model
        if model_type is None:
            raise ValueError('No model type was provided in the initialization')
        return model_type

    def get_all_model_types(self):
        return {self.static_model}

    def get_name(self):
        return f'Static-{self.static_model.name}'
