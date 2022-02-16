import logging
import os
import time
from dataclasses import dataclass
from typing import Iterable, Sequence, Mapping
import numpy as np

from lrtc_lib.definitions import ROOT_DIR, MODEL_FACTORY
from lrtc_lib.models.core.model_api import ModelAPI, ModelStatus, Prediction
from lrtc_lib.models.core.model_types import ModelTypes

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s')

@dataclass
class EnsemblePrediction(Prediction):
    model_type_to_prediction: dict


class Ensemble(ModelAPI):
    def __init__(self, model_types: Iterable[ModelTypes], aggregation=lambda x: np.mean(x, axis=0),
                 model_dir=os.path.join(ROOT_DIR, "output", "models", "ensemble"), return_all_scores=True):
        """
        Create train and infer over multiple models

        :param model_types: an ordered iterable of model types, models and return values would keep this order
        :param aggregation: aggregation function, scores and labels would represent this aggregation
        aggregation should get a list of model scores and return the aggregated score
        model scores dimensions: [model,score_per_class]
        common uses:
        sum, average: lambda x: np.mean(x, axis=0), return the first policy's score:lambda x:x[0]
        :param model_dir:
        :param return_all_scores: If true returns outputs of models with index of their number (corresponding to places in model_types argument)
        """
        super(Ensemble, self).__init__()

        if not os.path.isdir(model_dir):
            os.makedirs(model_dir)
        self.aggregation = aggregation
        self.model_dir = model_dir
        self.model_types = model_types
        self.models = [MODEL_FACTORY.get_model(model_type) for model_type in model_types]

    def train(self, train_data, train_params):
        model_ids = [model.train(train_data, train_params) for model in self.models]
        ensemble_model_id =  ",".join(model_ids)
        logging.info(f"training an ensemble model id {ensemble_model_id} using {len(train_data)} elements")
        return ensemble_model_id

    def _train(self, model_id: str, train_data: Sequence[Mapping], train_params: dict):
        pass

    def _infer(self, model_id, items_to_infer):
        type_to_predictions = {}
        all_scores = []
        for i, (model, model_type, m_id) in enumerate(zip(self.models, self.model_types, model_id.split(","))):
            # no need to cache the results as the ensemble is caching the results
            predictions = model.infer(m_id, items_to_infer, use_cache=False)
            type_to_predictions[model_type.name] = predictions
            all_scores.append([pred.score for pred in predictions])
        aggregated_scores = np.array(all_scores)
        aggregated_scores = np.apply_along_axis(self.aggregation, arr=aggregated_scores, axis=0)
        labels = [score > 0.5 for score in aggregated_scores]
        model_type_to_prediction_list = [{k: v[i] for k, v in type_to_predictions.items()}
                                         for i in range(len(predictions))]
        return [EnsemblePrediction(label=label, score=score, model_type_to_prediction=type_to_prediction)
                for label, score, type_to_prediction in zip(labels, aggregated_scores, model_type_to_prediction_list)]

    def get_model_status(self, model_id):
        statuses = [model.get_model_status(m_id) for model, m_id in zip(self.models, model_id.split(","))]
        if ModelStatus.ERROR in statuses:
            return ModelStatus.ERROR
        elif ModelStatus.TRAINING in statuses:
            return ModelStatus.TRAINING
        else:
            return ModelStatus.READY

    def get_models_dir(self):
        return self.model_dir

    def delete_model(self, model_id):
        for model, m_id in zip(self.models, model_id.split(",")):
            model.delete_model(m_id)

    def get_prediction_class(self):
        return EnsemblePrediction


if __name__ == '__main__':
    model = Ensemble([ModelTypes.NB_OVER_BOW, ModelTypes.SVM_OVER_GLOVE])
    train_data = [{"text": "I love dogs", "label": 1},
                  {"text": "I like to play with dogs", "label": 1},
                  {"text": "dogs are better than cats", "label": 1},
                  {"text": "cats cats cats", "label": 0},
                  {"text": "play with cats", "label": 0},
                  {"text": "dont know", "label": 0},
                  {"text": "what else", "label": 0}]
    model_id = model.train(train_data, {})
    while model.get_model_status(model_id)!=ModelStatus.READY:
        logging.info(f"waiting for model status to be ready {model.get_model_status(model_id)}")
        time.sleep(1)
    infer_list = []
    # for x in range(3):
    #     infer_list.append({"text": "hello " + str(uuid.uuid4()) + str(x)})
    infer_list.append({"text": "hello with play"})
    infer_list.append({"text": "I cats"})
    infer_list.append({"text": "I love dogs"})
    res = model.infer(model_id, infer_list)
    infer_list.append({"text": "not in cache"})
    res = model.infer(model_id, infer_list)
    logging.info("infer the same elements.")
    res = model.infer("NaiveBayes_64eba392-8f1f-11ec-874a-0a94ef3e9940,SVM_64ec1138-8f1f-11ec-874a-0a94ef3e9940", infer_list)
  #  model.delete_model(model_id)
    print(res)
