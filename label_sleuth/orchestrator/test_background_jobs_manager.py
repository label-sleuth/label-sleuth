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

import functools
import unittest
from unittest.mock import MagicMock

from label_sleuth.models.core.prediction import Prediction
from label_sleuth.orchestrator.background_jobs_manager import BackgroundJobsManager

DUMMY_PREDICTIONS = [Prediction(True, 0.54), Prediction(False, 0.22)]


def successful_train(mid, dummy_data):
    return mid


def train_failed_with_error(mid, dummy_data):
    raise Exception("Train failed")


def successful_infer(mid, dummy_data):
    return DUMMY_PREDICTIONS


def infer_failed_with_error(mid, dummy_data):
    raise Exception("Inference failed")


class TestBackgroundJobsManager(unittest.TestCase):
    def test_simple_training_job(self):
        callback_mock = MagicMock(name='callback')
        manager = BackgroundJobsManager()
        mid = 123
        dummy_callback_data = "workspace1"
        dummy_train_data = ["dummy"]
        future = manager.add_background_job(successful_train, (mid, dummy_train_data), False,
                                            done_callback=functools.partial(callback_mock, dummy_callback_data))
        mid_return = future.result()
        callback_mock.assert_called_once_with(dummy_callback_data, future)
        self.assertEqual(mid, mid_return)

    def test_training_error(self):
        callback_mock = MagicMock(name='callback')
        manager = BackgroundJobsManager()
        mid = 123
        dummy_callback_data = "workspace1"
        dummy_train_data = ["dummy"]
        future = manager.add_background_job(train_failed_with_error, (mid, dummy_train_data), False,
                                            done_callback=functools.partial(callback_mock, dummy_callback_data))
        self.assertRaises(Exception, future.result)
        callback_mock.assert_called_once_with(dummy_callback_data, future)

    def test_simple_infer_job(self):
        callback_mock = MagicMock(name='callback')
        manager = BackgroundJobsManager()
        mid = 123
        dummy_callback_data = "workspace1"
        dummy_train_data = ["dummy"]
        future = manager.add_background_job(successful_infer, (mid, dummy_train_data), False,
                                            done_callback=functools.partial(callback_mock, dummy_callback_data))
        predictions = future.result()
        callback_mock.assert_called_once_with(dummy_callback_data, future)
        self.assertEqual(DUMMY_PREDICTIONS, predictions)

    def test_infer_error(self):
        callback_mock = MagicMock(name='callback')
        manager = BackgroundJobsManager()
        mid = 123
        dummy_callback_data = "workspace1"
        dummy_train_data = ["dummy"]
        future = manager.add_background_job(infer_failed_with_error, (mid, dummy_train_data), False,
                                            done_callback=functools.partial(callback_mock, dummy_callback_data))
        self.assertRaises(Exception, future.result)
        callback_mock.assert_called_once_with(dummy_callback_data, future)
