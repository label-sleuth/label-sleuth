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

import inspect
import logging
import threading

from dataclasses import dataclass

from label_sleuth.models.core.model_api import ModelAPI
from label_sleuth.models.core.model_type import ModelType
from label_sleuth.models.core.tools import SentenceEmbeddingService
from label_sleuth.orchestrator.background_jobs_manager import BackgroundJobsManager


class ModelFactory:
    """
    Given a model type, this factory returns the relevant implementation of ModelAPI
    """
    def __init__(self, output_dir, background_jobs_manager: BackgroundJobsManager,
                 sentence_embedding_service: SentenceEmbeddingService):
        self.loaded_model_apis = {}
        self.model_dependencies = ModelDependencies(
            output_dir=output_dir, background_jobs_manager=background_jobs_manager,
            sentence_embedding_service=sentence_embedding_service, model_factory=self)
        self.lock = threading.RLock()

    def get_model_api(self, model_type: ModelType) -> ModelAPI:
        with self.lock:
            if model_type not in self.loaded_model_apis:
                try:
                    # check which of the model dependencies are used by this model implementation
                    model_input_args = inspect.signature(model_type.cls).parameters.keys()
                    kwargs = {k: v for k, v in self.model_dependencies.__dict__.items() if k in model_input_args}
                    # instantiate the model
                    model_api = model_type.cls(**kwargs)
                    self.loaded_model_apis[model_type] = model_api
                except Exception:
                    logging.exception(f"Could not get model type {model_type.cls} from the model factory")
        return self.loaded_model_apis[model_type]


@dataclass
class ModelDependencies:
    """
    These are the parameters that can be passed to the model's init method by the ModelFactory. Model implementations
    can use some or all of these parameters (as needed) as keyword arguments for initialization.
    """
    output_dir: str
    background_jobs_manager: BackgroundJobsManager
    sentence_embedding_service: SentenceEmbeddingService
    model_factory: ModelFactory
