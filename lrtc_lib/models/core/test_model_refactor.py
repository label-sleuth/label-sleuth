# import random
# import os
# import unittest
# import lrtc_lib.train_and_infer_service.train_and_infer_api as train_and_infer
# from lrtc_lib.train_and_infer_service.train_and_infer_random import TrainAndInferRandom
#
# PREFIX = 'Fascinating sentence'
#
#
# def string_to_score(item):
#     s = sum([ord(str) for c in item.values() for str in c])
#     return s
#
#
# @train_and_infer.infer_with_cache
# def mock_infer(self, model_id, items_to_infer, infer_params=None, use_cache=True):
#
#     scores = [string_to_score(item) for item in items_to_infer]
#     labels = [s > 2065 for s in scores]
#     return {'scores': scores, 'labels': labels, 'num_inferred_from_model': [len(items_to_infer) for _ in scores]}
#
#
# class TestModelAPI(unittest.TestCase):
#
#     def test_infer_cache(self):
#         api = TrainAndInferRandom()
#         model_id = '123'
#         all_nums = list(range(1, 10))
#         random.shuffle(all_nums)
#         small_batch = random.sample(all_nums, random.randint(1, len(all_nums)-3))
#         large_batch = all_nums
#
#         # Infer some and add to cache
#         sentences1 = [{'text': PREFIX + str(num)} for num in small_batch]
#         sentences1[0] = {**sentences1[0], "additional_field": "1"}
#         res1 = mock_infer(api, model_id=model_id, items_to_infer=sentences1, infer_params=None, use_cache=True)
#         assert api.cache.get_current_size() == len(small_batch)
#
#         # Infer larger batch without using cache
#         sentences2 = [{'text': PREFIX + str(num)} for num in large_batch]
#         res2 = mock_infer(api, model_id=model_id, items_to_infer=sentences2, infer_params=None, use_cache=False)
#         assert api.cache.get_current_size() == len(small_batch)
#         assert res2['num_inferred_from_model'][0] == len(large_batch)
#
#         # Infer larger batch with cache
#         res3 = mock_infer(api, model_id=model_id, items_to_infer=sentences2, infer_params=None, use_cache=True)
#         assert api.cache.get_current_size() == len(large_batch)+1  # +1 since one of the elements in sentences1 has an additional field
#         assert res3['scores'] == res2['scores']
#         large_batch_only = [i for i, n in enumerate(large_batch) if n not in small_batch]
#         assert res3['num_inferred_from_model'][large_batch_only[2]] == len(large_batch_only)+1  # +1 since one of the elements in sentences1 has an additional field
#
#         disk_cache = os.path.join(api.get_models_dir(), train_and_infer.PREDICTIONS_CACHE_DIR_NAME, model_id + ".json")
#         os.remove(disk_cache)
