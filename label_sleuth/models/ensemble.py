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
import os

from concurrent.futures import Future
from dataclasses import dataclass
from typing import Iterable, Mapping, Sequence, Tuple

import numpy as np

from label_sleuth.models.core.model_api import ModelAPI
from label_sleuth.models.core.model_type import ModelType
from label_sleuth.models.core.models_background_jobs_manager import ModelsBackgroundJobsManager
from label_sleuth.models.core.models_factory import ModelDependencies
from label_sleuth.models.core.prediction import Prediction

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s')


@dataclass
class EnsemblePrediction(Prediction):
    model_type_to_prediction: dict


class Ensemble(ModelAPI):
    def __init__(self, output_dir, model_types: Iterable[ModelType],
                 models_background_jobs_manager: ModelsBackgroundJobsManager,
                 model_dependencies: ModelDependencies,
                 aggregation_func=lambda x: np.mean(x, axis=0)):
        """
        Create an ensemble model aggregating different model types

        :param output_dir:
        :param model_types: a list of model types
        :param model_factory:
        :param models_background_jobs_manager:
        :param aggregation_func: function to aggregate the predictions of the different models. The function gets an
        array of scores (where dimension 0 is the model types and dimension 1 is the list of elements), and returns a
        vector of aggregated scores. Defaults to mean score aggregation.
        """
        super().__init__(models_background_jobs_manager)
        self.model_dir = os.path.join(output_dir, "ensemble")
        os.makedirs(self.model_dir, exist_ok=True)
        self.aggregation_func = aggregation_func
        self.model_types = model_types
        self.models = [model_dependencies.model_factory.get_model(model_type) for model_type in model_types]

    def train(self, train_data, language, model_params=None, done_callback=None) -> Tuple[str, Future]:
        """
        Submits training of the different model types in the background, and returns a model_id and future object
        for the ensemble model.
        """
        if model_params is None:
            model_params = {}
        model_ids_and_futures = [model.train(train_data, language, model_params) for model in self.models]
        ensemble_model_id = ",".join(model_id for model_id, future in model_ids_and_futures)
        self.mark_train_as_started(ensemble_model_id)
        self.save_metadata(ensemble_model_id, language, model_params)

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

    def _train(self, model_id: str, train_data: Sequence[Mapping], model_params: dict):
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


class SVM_Ensemble(Ensemble):
    def __init__(self, output_dir, models_background_jobs_manager, model_dependencies):
        from label_sleuth.models.core.catalog import ModelsCatalog
        super().__init__(output_dir=output_dir, models_background_jobs_manager=models_background_jobs_manager,
                         model_types=[ModelsCatalog.SVM_OVER_BOW, ModelsCatalog.SVM_OVER_GLOVE],
                         model_dependencies=model_dependencies)
