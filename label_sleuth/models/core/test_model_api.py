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
from unittest.mock import MagicMock

from label_sleuth.models.core.languages import Languages
from label_sleuth.models.random_model import RandomModel
from label_sleuth.orchestrator.background_jobs_manager import BackgroundJobsManager

PREFIX = 'Fascinating sentence'


class TestModelAPI(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.model_api = RandomModel(self.temp_dir.name, BackgroundJobsManager())
        self.model_id, future = self.model_api.train([], Languages.ENGLISH, {})
        future.result()
        all_nums = list(range(1, 10))
        random.shuffle(all_nums)
        small_batch = random.sample(all_nums, 3)
        large_batch = all_nums
        self.sentences1 = [{'text': PREFIX + str(num)} for num in small_batch]
        self.sentences2 = [{'text': PREFIX + str(num)} for num in large_batch]

    def test_infer_no_cache(self):
        self.model_api.infer_by_id(model_id=self.model_id, items_to_infer=self.sentences1, use_cache=False)
        self.assertEqual(0, self.model_api.cache.get_current_size(), "cache size should be zero when use_cache=False")

    def test_additional_fields_are_part_of_cache_key(self):
        self.model_api.infer_by_id(model_id=self.model_id, items_to_infer=self.sentences1, use_cache=True)
        self.assertEqual(len(self.sentences1), self.model_api.cache.get_current_size(),
                         "cache size should be equals to the size of the inferred sentences")
        self.sentences1[0] = {**self.sentences1[0], "additional_field": "1"}
        self.model_api.infer_by_id(model_id=self.model_id, items_to_infer=self.sentences1, use_cache=True)
        self.assertEqual(len(self.sentences1)+1, self.model_api.cache.get_current_size(),
                         "now sentences[0] has an additional field so the cache size should be len(sentences)+1")

    def test_inferred_elements_cached(self):
        self.model_api.infer_by_id(model_id=self.model_id, items_to_infer=self.sentences1, use_cache=True)
        self.assertEqual(len(self.sentences1), self.model_api.cache.get_current_size(),
                         "cache size should be equal to the size of the inferred sentences")
        self.model_api._infer = MagicMock(name='_infer')

        self.model_api.infer_by_id(model_id=self.model_id, items_to_infer=self.sentences1, use_cache=True)
        self.model_api._infer.assert_not_called()

    def tearDown(self):
        self.temp_dir.cleanup()
