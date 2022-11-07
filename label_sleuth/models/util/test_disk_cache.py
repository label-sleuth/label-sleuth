import unittest
import tempfile
import os
from label_sleuth.models.core.prediction import Prediction
from label_sleuth.models.util.disk_cache import save_model_prediction_store_to_disk, \
    load_model_prediction_store_from_disk


class TestDiskCache(unittest.TestCase):
    def test_save_equals_load(self):
        cache = {
            str(('SVM_mid', (('text', 'Embrace growth and innovation!'),)),): Prediction(True, 0.9),
            str(('SVM_mid', (('text', 'parking lot'),)),): Prediction(False, 0.4)
        }
        temp_dir = tempfile.TemporaryDirectory()
        cache_file_path = os.path.join(temp_dir.name, "cache.json")
        save_model_prediction_store_to_disk(cache_file_path, cache)
        loaded = load_model_prediction_store_from_disk(cache_file_path, Prediction)

        temp_dir.cleanup()
        self.assertEqual(cache, loaded)
