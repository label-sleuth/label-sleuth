import os
import random
import numpy as np

from lrtc_lib.definitions import ROOT_DIR
from lrtc_lib.models.core.model_api import ModelAPI, ModelStatus, Prediction

MODEL_DIR = os.path.join(ROOT_DIR, "output", "models", "random")


class RandomModel(ModelAPI):
    def __init__(self):
        super().__init__()
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
        return MODEL_DIR

    def delete_model(self, model_id):
        if model_id in self.model_id_to_random_seed:
            self.model_id_to_random_seed.pop(model_id)
