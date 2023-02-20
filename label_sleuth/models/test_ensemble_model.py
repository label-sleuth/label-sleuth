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

import random
import tempfile
import unittest

from label_sleuth.data_access.core.data_structs import LABEL_POSITIVE, LABEL_NEGATIVE
from label_sleuth.models.core.catalog import ModelsCatalog
from label_sleuth.models.core.languages import Languages
from label_sleuth.models.core.model_api import ModelStatus
from label_sleuth.models.core.models_factory import ModelFactory
from label_sleuth.models.ensemble import Ensemble
from label_sleuth.orchestrator.background_jobs_manager import BackgroundJobsManager

PREFIX = 'Fascinating sentence'


def train_failed_with_error(*args, **kwargs):
    raise Exception("Training failed")


class TestEnsembleModel(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.background_job_manager = BackgroundJobsManager()
        model_factory = ModelFactory(self.temp_dir.name, self.background_job_manager, None)
        self.ensemble = Ensemble(self.temp_dir.name, model_types=[ModelsCatalog.RAND, ModelsCatalog.NB_OVER_BOW],
                                 background_jobs_manager=self.background_job_manager,
                                 model_factory=model_factory)
        all_nums = list(range(1, 15))
        random.shuffle(all_nums)
        self.sentences = [{'text': f'{PREFIX} {num}', 'label': random.choice([LABEL_POSITIVE, LABEL_NEGATIVE])}
                          for num in all_nums]

    def test_one_ensemble_model_fails(self):
        self.ensemble.model_apis[1]._train = train_failed_with_error
        ensemble_model_id, future = self.ensemble.train(self.sentences, Languages.ENGLISH)
        self.assertRaises(Exception, future.result)

    def test_ensemble_flow(self):
        ensemble_model_id, future = self.ensemble.train(self.sentences, Languages.ENGLISH)

        model_ids = ensemble_model_id.split(',')
        self.assertEqual(len(model_ids), len(self.ensemble.model_apis))

        future.result()
        for model_id, model_api in zip(model_ids, self.ensemble.model_apis):
            self.assertEqual(model_api.get_model_status(model_id), ModelStatus.READY)

        ensemble_predictions = self.ensemble.infer_by_id(ensemble_model_id, self.sentences)
        for ensemble_pred in ensemble_predictions:
            scores = [ensemble_pred.model_type_to_prediction[t.name].score for t in self.ensemble.model_types]
            self.assertEqual(ensemble_pred.score, self.ensemble.aggregation_func(scores))

    #TODO add a test for ensemble model path validation once export is fully implemented

    def tearDown(self):
        self.temp_dir.cleanup()
