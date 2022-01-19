import os
from typing import Iterable
import numpy as np

from lrtc_lib.definitions import ROOT_DIR
from lrtc_lib.train_and_infer_service.model_type import ModelType
from lrtc_lib.train_and_infer_service.train_and_infer_api import ModelStatus, TrainAndInferAPI, \
    infer_with_cache, delete_model_cache
from lrtc_lib.train_and_infer_service.train_and_infer_factory import TrainAndInferFactory
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s')


class TrainAndInferMulti(TrainAndInferAPI):
    def __init__(self, model_types: Iterable[ModelType], multi_label=False, factory=None,
                 aggregation=lambda x: np.mean(x, axis=0),
                 model_dir=os.path.join(ROOT_DIR, "output", "models", "multi"), return_all_scores=True):
        """
        Create train and infer over multiple models

        :param model_types: an ordered iterable of model types, models and return values would keep this order
        :param multi_label:
        :param factory:
        :param aggregation: aggregation function, scores and labels would represent this aggregation
        aggregation should get a list of model scores and return the aggregated score
        model scores dimensions: [model,score_per_class]
        common uses:
        sum, average: lambda x: np.mean(x, axis=0), return the first model's score:lambda x:x[0]
        :param model_dir:
        :param return_all_scores: If true returns outputs of models with index of their number (corresponding to places in model_types argument)
        """
        super().__init__()

        if factory is None:
            factory = TrainAndInferFactory()
        if not os.path.isdir(model_dir):
            os.makedirs(model_dir)
        self.aggregation = aggregation
        self.model_dir = model_dir

        self.return_all_scores= return_all_scores
        self.models = [factory.get_train_and_infer(model_type) for model_type in model_types]

    def train(self, train_data, dev_data, train_params):
        model_ids = [model.train(train_data, dev_data, train_params) for model in self.models]
        return ",".join(model_ids)

    @infer_with_cache
    def infer(self, model_id, items_to_infer, infer_params=None, use_cache=True):
        results = {}
        all_scores = []
        for i, (model, m_id) in enumerate(zip(self.models, model_id.split(","))):
            res = model.infer(m_id, items_to_infer, infer_params, use_cache)
            if self.return_all_scores:
                for key, val in res.items():
                    # currently raises if key is not a string, to not assume it: f"{key}{i}"
                    results[key + str(i)] = val
            all_scores.append(res[f"scores"])
        aggregated_scores = np.array(all_scores)
        aggregated_scores = np.apply_along_axis(self.aggregation, arr=aggregated_scores, axis=0)
        labels = [int(np.argmax(score)) for score in aggregated_scores]
        results["scores"] = aggregated_scores.tolist()
        results["labels"] = labels
        return results

    def get_model_status(self, model_id):
        statuses = [model.get_model_status(m_id) for model, m_id in zip(self.models, model_id.split(","))]
        if ModelStatus.ERROR in statuses:
            return ModelStatus.ERROR
        elif ModelStatus.TRAINING in statuses:
            return ModelStatus.TRAINING
        else:
            return ModelStatus.READY

    def get_models_dir(self):
        return self.models[0].get_models_dir()

    @delete_model_cache
    def delete_model(self, model_id):
        for model, m_id in zip(self.models, model_id.split(",")):
            model.delete_model(m_id)


if __name__ == '__main__':
    from lrtc_lib.train_and_infer_service.model_type import ModelTypes
    tni = TrainAndInferMulti([ModelTypes.NB_OVER_BOW, ModelTypes.SVM_OVER_GLOVE])
    train_data = [{"text": "I love dogs", "label": 1},
                  {"text": "I like to play with dogs", "label": 1},
                  {"text": "dogs are better than cats", "label": 1},
                  {"text": "cats cats cats", "label": 0},
                  {"text": "play with cats", "label": 0},
                  {"text": "dont know", "label": 0},
                  {"text": "what else", "label": 0}]
    model_id = tni.train(train_data, None, None, {})
    infer_list = []
    # for x in range(3):
    #     infer_list.append({"text": "hello " + str(uuid.uuid4()) + str(x)})
    infer_list.append({"text": "hello with play"})
    infer_list.append({"text": "I cats"})
    infer_list.append({"text": "I love dogs"})
    res = tni.infer(model_id, infer_list, {})
    print(res)
