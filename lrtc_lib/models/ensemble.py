import logging
import os

from concurrent.futures import Future
from dataclasses import dataclass
from typing import Iterable, Mapping, Sequence, Tuple

import numpy as np

from lrtc_lib.definitions import ROOT_DIR
from lrtc_lib.models.core.model_api import ModelAPI
from lrtc_lib.models.core.model_types import ModelTypes
from lrtc_lib.models.core.models_background_jobs_manager import ModelsBackgroundJobsManager
from lrtc_lib.models.core.models_factory import ModelFactory
from lrtc_lib.models.core.prediction import Prediction

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s')


@dataclass
class EnsemblePrediction(Prediction):
    model_type_to_prediction: dict


class Ensemble(ModelAPI):
    def __init__(self, model_types: Iterable[ModelTypes], model_factory: ModelFactory,
                 models_background_jobs_manager: ModelsBackgroundJobsManager,
                 aggregation_func=lambda x: np.mean(x, axis=0),
                 model_dir=os.path.join(ROOT_DIR, "output", "models", "ensemble")):
        """
        Create an ensemble model aggregating different model types

        :param model_types: a list of model types
        :param aggregation_func: function to aggregate the predictions of the different models. The function gets an
        array of scores (where dimension 0 is the model types and dimension 1 is the list of elements), and returns a
        vector of aggregated scores. Defaults to mean score aggregation.
        :param model_dir:
        """
        super().__init__(models_background_jobs_manager)

        os.makedirs(model_dir, exist_ok=True)
        self.aggregation_func = aggregation_func
        self.model_dir = model_dir
        self.model_types = model_types
        self.models = [model_factory.get_model(model_type) for model_type in model_types]

    def train(self, train_data, train_params, done_callback=None) -> Tuple[str, Future]:
        """
        Submits training of the different model types in the background, and returns a model_id and future object
        for the ensemble model.
        """
        model_ids_and_futures = [model.train(train_data, train_params) for model in self.models]
        ensemble_model_id = ",".join(model_id for model_id, future in model_ids_and_futures)
        self.mark_train_as_started(ensemble_model_id)
        self.save_metadata(ensemble_model_id, train_params)

        future = self.models_background_jobs_manager.add_training(
            ensemble_model_id, self.wait_and_update_status,
            train_args=(ensemble_model_id, [future for model_id, future in model_ids_and_futures]),
            use_gpu=self.gpu_support, done_callback=done_callback)
        logging.info(f"training an ensemble model id {ensemble_model_id} using {len(train_data)} elements")
        return ensemble_model_id, future

    def wait_and_update_status(self, model_id: str, train_futures: Iterable[Future]) -> str:
        """
        Wait for the training of the different models, and return *model_id* if all have finished successfully.

        :param model_id: id for the ensemble model
        :param train_futures: future objects for the _train() functions of the different models
        :return: model_id
        """

        try:
            for future in train_futures:
                future.result()
            self.mark_train_as_completed(model_id)
        except Exception:
            logging.exception(f'model {model_id} failed with exception')
            self.mark_train_as_error(model_id)
            raise

        return model_id

    def _train(self, model_id: str, train_data: Sequence[Mapping], train_params: dict):
        pass

    def _infer(self, model_id, items_to_infer) -> Sequence[EnsemblePrediction]:
        """
        Aggregate the predictions returned by the different models using self.aggregation_func
        """
        type_to_all_predictions = {}
        all_scores = []
        for model, model_type, m_id in zip(self.models, self.model_types, model_id.split(",")):
            # no need to cache the results as the ensemble is caching the results
            predictions = model.infer(m_id, items_to_infer, use_cache=False)
            type_to_all_predictions[model_type.name] = predictions
            all_scores.append([pred.score for pred in predictions])
        aggregated_scores = np.apply_along_axis(self.aggregation_func, arr=np.array(all_scores), axis=0)
        labels = [score > 0.5 for score in aggregated_scores]
        type_to_prediction_per_element = [{model_type: model_preds[i] for model_type, model_preds
                                           in type_to_all_predictions.items()} for i in range(len(items_to_infer))]
        return [EnsemblePrediction(label=label, score=score, model_type_to_prediction=type_to_prediction)
                for label, score, type_to_prediction in zip(labels, aggregated_scores, type_to_prediction_per_element)]

    def get_models_dir(self):
        return self.model_dir

    def delete_model(self, model_id):
        for model, m_id in zip(self.models, model_id.split(",")):
            model.delete_model(m_id)

    def get_prediction_class(self):
        return EnsemblePrediction
