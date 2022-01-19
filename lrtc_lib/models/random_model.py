# (c) Copyright IBM Corporation 2020.

# LICENSE: Apache License 2.0 (Apache-2.0)
# http://www.apache.org/licenses/LICENSE-2.0

import os
import random
import numpy as np

from lrtc_lib.definitions import ROOT_DIR
from lrtc_lib.models.core.model_api import ModelAPI, ModelStatus

MODEL_DIR = os.path.join(ROOT_DIR, "output", "models", "random")


class RandomModel(ModelAPI):
    def __init__(self):
        super(ModelAPI, self).__init__()
        self.models = set()
        self.id = -1

    def train(self, train_data, dev_data, train_params):
        self.id += 1
        self.models.add(self.id)
        return self.id

    def infer(self, model_id, items_to_infer, infer_params=None, use_cache=False):
        if model_id not in self.models:
            raise ValueError("trying to infer with untrained policy")
        random_previous_state = random.getstate()
        random.seed(model_id)
        predicted = np.array([random.random() for _ in range(len(items_to_infer))])
        random.setstate(random_previous_state)
        predicted = np.array([(pred, 1 - pred) for pred in predicted])  # amount of classes is currently fixed
        labels = [np.argmax(prediction) for prediction in predicted]
        return {"labels": labels, "scores": predicted}

    def get_model_status(self, model_id):
        if model_id in self.models:
            return ModelStatus.READY
        return ModelStatus.ERROR

    def get_models_dir(self):
        return MODEL_DIR

    def delete_model(self, model_id):
        if model_id in self.models:
            self.models.remove(model_id)
