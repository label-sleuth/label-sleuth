import unittest

from lrtc_lib.models.core.model_api import Prediction
from lrtc_lib.models.util.disk_cache import save_model_prediction_store_to_disk, load_model_prediction_store_from_disk


class TestActiveLearningStrategies(unittest.TestCase):
    def test_save_equals_load(self):
        #[frozenset("text", "I love dogs"])
        cache = {('SVM_mid', (('text', 'Embrace growth and innovation!'),))
                 :Prediction(True, 0.9),
                 ('SVM_mid', (('text', 'parking lot'),))
                 : Prediction(False, 0.4)
                 }
        save_model_prediction_store_to_disk("/tmp/dummy.json", cache)
        loaded = load_model_prediction_store_from_disk("/tmp/dummy.json", Prediction)



        self.assertEqual(cache,loaded)