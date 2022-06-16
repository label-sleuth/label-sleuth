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

from label_sleuth.models.core.model_api import ModelAPI
from label_sleuth.models.core.model_type import ModelType
from label_sleuth.models.core.models_background_jobs_manager import ModelsBackgroundJobsManager
from label_sleuth.models.ensemble import Ensemble


class ModelFactory(object):
    """
    Given a model type, this factory returns the relevant implementation of ModelAPI
    """
    def __init__(self, output_dir, models_background_jobs_manager: ModelsBackgroundJobsManager):
        self.loaded_models = {}
        self.output_dir = output_dir
        self.models_background_jobs_manager = models_background_jobs_manager

    def get_model(self, model_type: ModelType) -> ModelAPI:
        kwargs = {'output_dir': self.output_dir,
                  'models_background_jobs_manager': self.models_background_jobs_manager,
                  }
        # Ensemble models require the model factory as input
        if issubclass(model_type.cls, Ensemble):
            kwargs['model_factory'] = self

        if model_type not in self.loaded_models:
            try:
                model = model_type.cls(**kwargs)
                self.loaded_models[model_type] = model
            except Exception:
                logging.exception(f"Could not get model type {model_type.cls} from the model factory")

        return self.loaded_models[model_type]
