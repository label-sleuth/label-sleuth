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

import os
import random
import numpy as np

from label_sleuth.models.core.languages import Languages
from label_sleuth.models.core.model_api import ModelAPI, ModelStatus
from label_sleuth.models.core.prediction import Prediction
from label_sleuth.orchestrator.background_jobs_manager import BackgroundJobsManager


class RandomModel(ModelAPI):
    """
    Mock classification model that does not train, and returns random classification predictions.
    """
    def __init__(self, output_dir, background_jobs_manager: BackgroundJobsManager):
        super().__init__(output_dir, background_jobs_manager)

        self.model_id_to_random_seed = {}
        self.random_seed = -1

    def _train(self, model_id, train_data, model_params):
        seed = self.random_seed + 1
        self.model_id_to_random_seed[model_id] = seed
        self.random_seed = seed

    def load_model(self, model_path) -> int:
        # RandomModel does not require loading any model objects from disk, we implement it this way for compatibility
        # with the rest of the system
        model_id = os.path.basename(model_path)
        random_seed = self.model_id_to_random_seed[model_id]
        return random_seed

    def infer(self, random_seed: int, items_to_infer):
        rand = random.Random(random_seed)
        scores = np.array([rand.random() for _ in range(len(items_to_infer))])
        labels = [score > 0.5 for score in scores]
        return [Prediction(label=label, score=score) for label, score in zip(labels, scores)]

    def get_model_status(self, model_id):
        if model_id in self.model_id_to_random_seed:
            return ModelStatus.READY
        return ModelStatus.ERROR

    def delete_model(self, model_id):
        if model_id in self.model_id_to_random_seed:
            self.model_id_to_random_seed.pop(model_id)

    def get_supported_languages(self):
        return Languages.all_languages()
