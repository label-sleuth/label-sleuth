import os
import random
import numpy as np

from lrtc_lib.models.core.models_background_jobs_manager import ModelsBackgroundJobsManager
from lrtc_lib.models.core.model_api import ModelAPI, ModelStatus
from lrtc_lib.models.core.prediction import Prediction


class RandomModel(ModelAPI):
    """
    Mock classification model that does not train, and returns random classification predictions.
    """
    def __init__(self, output_dir, models_background_jobs_manager: ModelsBackgroundJobsManager):
        super().__init__(models_background_jobs_manager)
        self.model_dir = os.path.join(output_dir, "random")
        os.makedirs(self.model_dir, exist_ok=True)

        self.model_id_to_random_seed = {}
        self.random_seed = -1

    def _train(self, model_id, train_data, train_params):
        seed = self.random_seed + 1
        self.model_id_to_random_seed[model_id] = seed
        self.random_seed = seed

    def _infer(self, model_id, items_to_infer):
        rand = random.Random(self.model_id_to_random_seed[model_id])
        scores = np.array([rand.random() for _ in range(len(items_to_infer))])
        labels = [score > 0.5 for score in scores]
        return [Prediction(label=label, score=score) for label, score in zip(labels, scores)]

    def get_model_status(self, model_id):
        if model_id in self.model_id_to_random_seed:
            return ModelStatus.READY
        return ModelStatus.ERROR

    def get_models_dir(self):
        return self.model_dir

    def delete_model(self, model_id):
        if model_id in self.model_id_to_random_seed:
            self.model_id_to_random_seed.pop(model_id)
