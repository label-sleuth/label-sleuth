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
import re
import shutil
import tempfile

from concurrent.futures import Future
from dataclasses import dataclass
from typing import Iterable, Mapping, Sequence, Tuple, List, Union

import numpy as np

from label_sleuth.models.core.model_api import ModelAPI
from label_sleuth.models.core.model_type import ModelType
from label_sleuth.models.core.prediction import Prediction
from label_sleuth.orchestrator.background_jobs_manager import BackgroundJobsManager

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s')


@dataclass
class EnsemblePrediction(Prediction):
    model_type_to_prediction: dict


@dataclass
class EnsembleComponents:
    models: List


class Ensemble(ModelAPI):
    def __init__(self, output_dir, model_types: Iterable[ModelType],
                 background_jobs_manager: BackgroundJobsManager,
                 model_factory,
                 aggregation_func=lambda x: np.mean(x, axis=0)):
        """
        Create an ensemble model aggregating different model types

        :param output_dir:
        :param model_types: a list of model types
        :param model_factory:
        :param background_jobs_manager:
        :param aggregation_func: function to aggregate the predictions of the different models. The function gets an
        array of scores (where dimension 0 is the model types and dimension 1 is the list of elements), and returns a
        vector of aggregated scores. Defaults to mean score aggregation.
        """
        super().__init__(output_dir, background_jobs_manager)
        self.aggregation_func = aggregation_func
        self.model_types = model_types
        self.model_apis = [model_factory.get_model_api(model_type) for model_type in model_types]

    def train(self, train_data, language, model_params=None, done_callback=None) -> Tuple[str, Future]:
        """
        Submits training of the different model types in the background, and returns a model_id and future object
        for the ensemble model.
        """
        if model_params is None:
            model_params = {}
        model_ids_and_futures = [model_api.train(train_data, language, model_params) for model_api in self.model_apis]
        ensemble_model_id = ",".join(model_id for model_id, future in model_ids_and_futures)
        self.mark_train_as_started(ensemble_model_id)
        self.save_metadata(ensemble_model_id, language, model_params)

        future = self.background_jobs_manager.add_background_job(
            self.wait_and_update_status,
            args=(ensemble_model_id, [future for model_id, future in model_ids_and_futures]),
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

    def load_model(self, model_path: Union[str, List]) -> EnsembleComponents:
        if isinstance(model_path, list):
            # for internal use by the system, where paths for the constituting models are passed
            # from Ensemble._infer_by_id()
            model_paths = model_path
        else:
            # for external use, where the ensemble has been exported into a single folder containing all the models
            model_path = model_path.rstrip("/")
            model_prefixes = [model_api.__class__.__name__ for model_api in self.model_apis]
            ensemble_id_regex = ','.join([f'{model_prefix}_[a-z0-9-]+' for model_prefix in model_prefixes])
            if not re.fullmatch(ensemble_id_regex, os.path.basename(model_path)):
                raise Exception(
                    f"model {os.path.basename(model_path)} does not match the expected ensemble directory name "
                    f"of <class_name1>_<guid1>,<class_name2>_<guid2> (for example "
                    f"SVM_BOW_5e805580-1ee3-11ed-878b-0a94ef3e9940,SVM_GloVe_5e80af4e-1ee3-11ed-878b-0a94ef3e9940). "
                    f"Exported model name should not be changed")

            ensemble_model_id = os.path.basename(model_path)
            model_paths = [os.path.join(model_path, model_id) for model_id in ensemble_model_id.split(",")]

        models = [model_api.load_model(model_path) for model_api, model_path in zip(self.model_apis, model_paths)]
        return EnsembleComponents(models=models)

    def _infer_by_id(self, model_id, items_to_infer):
        """
        We override ModelAPI._infer as we need to extract the paths to all of the models constituting the ensemble
        """
        model_paths = [model_api.get_model_dir_by_id(m_id)
                       for m_id, model_api in zip(model_id.split(","), self.model_apis)]
        model = self.load_model(model_path=model_paths)
        return self.infer(model, items_to_infer)

    def infer(self, ensemble: EnsembleComponents, items_to_infer) -> Sequence[EnsemblePrediction]:
        """
        Aggregate the predictions returned by the different models using self.aggregation_func
        """
        type_to_all_predictions = {}
        all_scores = []
        for model_api, model, model_type in zip(self.model_apis, ensemble.models, self.model_types):
            predictions = model_api.infer(model, items_to_infer)
            type_to_all_predictions[model_type.name] = predictions
            all_scores.append([pred.score for pred in predictions])
        aggregated_scores = np.apply_along_axis(self.aggregation_func, arr=np.array(all_scores), axis=0)
        labels = [score > 0.5 for score in aggregated_scores]
        type_to_prediction_per_element = [{model_type: model_preds[i] for model_type, model_preds
                                           in type_to_all_predictions.items()} for i in range(len(items_to_infer))]
        return [EnsemblePrediction(label=label, score=score, model_type_to_prediction=type_to_prediction)
                for label, score, type_to_prediction in zip(labels, aggregated_scores, type_to_prediction_per_element)]

    def delete_model(self, model_id):
        for model_api, m_id in zip(self.model_apis, model_id.split(",")):
            model_api.delete_model(m_id)

    def get_prediction_class(self):
        return EnsemblePrediction

    def copy_model_dir_for_export(self, ensemble_model_id):
        temp_path = str(tempfile.mkdtemp())
        ensemble_output_path = os.path.join(temp_path, os.path.basename(self.get_model_dir_by_id(ensemble_model_id)))
        for model_api, m_id in zip(self.model_apis, ensemble_model_id.split(",")):
            model_path = model_api.get_model_dir_by_id(m_id)
            output_path = os.path.join(ensemble_output_path, os.path.basename(model_path))
            shutil.copytree(model_path, output_path)
        return ensemble_output_path

    def get_supported_languages(self):
        return set.intersection(*[model_api.get_supported_languages() for model_api in self.model_apis])


class SVM_Ensemble(Ensemble):
    def __init__(self, output_dir, background_jobs_manager, model_factory):
        from label_sleuth.models.core.catalog import ModelsCatalog
        super().__init__(output_dir=output_dir, background_jobs_manager=background_jobs_manager,
                         model_types=[ModelsCatalog.SVM_OVER_BOW, ModelsCatalog.SVM_OVER_WORD_EMBEDDINGS],
                         model_factory=model_factory)
