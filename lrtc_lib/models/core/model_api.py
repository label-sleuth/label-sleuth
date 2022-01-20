import abc
import functools
import logging
import os
import threading
from enum import Enum
from typing import Dict, Mapping, Sequence


import lrtc_lib.definitions as definitions
from lrtc_lib.models.util.LRUCache import LRUCache
from lrtc_lib.models.util.disk_cache import get_disk_cache, save_cache_to_disk

PREDICTIONS_CACHE_DIR_NAME = "predictions_cache"


class ModelStatus(Enum):
    TRAINING = 0
    READY = 1
    ERROR = 2
    DELETED = 3


class ModelAPI(object, metaclass=abc.ABCMeta):
    def __init__(self):
        if hasattr(self.infer, "__wrapper_func__") and getattr(self.infer, "__wrapper_func__") == infer_with_cache.__name__:
            assert hasattr(self.delete_model, "__wrapper_func__") \
                   and getattr(self.delete_model, "__wrapper_func__") == delete_model_cache.__name__, \
                f"When wrapping infer method using '{infer_with_cache.__name__}', delete method should be wrapped by '{delete_model_cache.__name__}'"
            getattr(self.infer, "__wrapper_func__")
        self.cache = LRUCache(definitions.INFER_CACHE_SIZE)

    @abc.abstractmethod
    def train(self, train_data: Sequence[Mapping], dev_data: Sequence[Mapping],
              train_params: dict) -> str:
        """
        train a new model and return a unique model identifier that will be used for inference.
        :param train_data: a list of dictionaries with at least the "text" and "label" fields, additional fields can be
        passed e.g. [{'text': 'text1', 'label': 1, 'additional_field': 'value1'}, {'text': 'text2', 'label': 0,
        'additional_field': 'value2'}]
        :param dev_data: can be None if not used by the implemented model
        :param test_data: can be None if not used by the implemented model
        :param train_params: dictionary for additional train parameters (can be None)
        :rtype: model_id unique id
        """
        self.__raise_not_implemented('train')

    @abc.abstractmethod
    def infer(self, model_id, items_to_infer: Sequence[Mapping], infer_params: dict, use_cache=True) -> Dict:
        """
        infer a given sequence of elements and return the results
        :param model_id:
        :param items_to_infer: a list of dictionaries with at least the "text" field, additional fields can be passed
        e.g. [{'text': 'text1', 'additional_field': 'value1'}, {'text': 'text2', 'additional_field': 'value2'}]
        :param infer_params: dictionary for additional inference parameters (can be None)
        :param use_cache: save the inference results to cache. Default is True. In order to use the built-in cache
        mechanism, add the 'infer_with_cache' wrapper as a decorator.
        :rtype: dictionary with at least the "labels" key where the value is a list of numeric labels for each element
        in items_to_infer, additional keys (with list values of the same length) can be passed
         e.g {"labels": [1,0], "gradients": [[0.24,-0.39,-0.66,0.25], [0.14,0.29,-0.26,0.16]]
        """
        self.__raise_not_implemented('infer')

    @abc.abstractmethod
    def get_model_status(self, model_id) -> ModelStatus:
        """
        return one of:
        ModelStatus.TRAINING - for async mode implementations only
        ModelStatus.READY - model is ready
        ModelStatus.ERROR - training error

        :rtype: ModelStatus
        :param model_id:
        """
        self.__raise_not_implemented('get_model_status')

    @abc.abstractmethod
    def get_models_dir(self):
        self.__raise_not_implemented('get_models_dir')

    @abc.abstractmethod
    def delete_model(self, model_id):
        self.__raise_not_implemented('delete_model')

    def export_model(self, model_id):
        raise NotImplementedError(f'export function has not been implemented for {self.__class__.__name__}')

    def __raise_not_implemented(self, func_name):
        raise NotImplementedError('users must define ' + func_name + ' to use this base class')

    def get_prediction_cache_file(self, model_id):
        return os.path.join(self.get_models_dir(), PREDICTIONS_CACHE_DIR_NAME, model_id + ".json")


def infer_with_cache(infer_function):
    """
    Wrapper for the "infer" call that incorporates both an in-memory cache and a disk cache for inference results
    """
    @functools.wraps(infer_function)
    def wrapper(self: ModelAPI, model_id, items_to_infer, infer_params, use_cache=True):
        if not use_cache:
            return infer_function(self, model_id, items_to_infer, infer_params, use_cache)
        if not hasattr(self,"lock"):
            self.lock = threading.Lock()
        with self.lock:
            infer_params_key = None if infer_params is None else tuple(sorted(infer_params.items()))
            cache_keys = [(model_id, tuple(sorted(item.items())), infer_params_key) for item in items_to_infer]
            infer_res = [self.cache.get(cache_key) for cache_key in cache_keys]
            cache_misses = [i for i, v in enumerate(infer_res) if v is None]

            if len(cache_misses) > 0:  # not in memory cache, try loading from disk cache
                model_cache_file = self.get_prediction_cache_file(model_id)
                logging.debug("start loading cache from disk")
                disk_cache = get_disk_cache(model_cache_file)
                logging.debug("done loading cache from disk")
                if len(disk_cache) > 0:
                    for key in disk_cache.keys():
                        self.cache.set(key, disk_cache[key])
                    for idx in cache_misses:
                        infer_res[idx] = self.cache.get(cache_keys[idx])
                    cache_misses = [i for i, v in enumerate(infer_res) if v is None]

            logging.info(f"{len(items_to_infer)-len(cache_misses)} already in cache, running infer for {len(cache_misses)}"
                         f" values (cache size {self.cache.get_current_size()}) in {self.__class__.__name__}")

            if len(cache_misses) > 0:  # not in memory cache or in disk cache
                missing_entries = [items_to_infer[idx] for idx in cache_misses]
                uniques = set()
                # if duplicates exist, do not infer the same item more than once
                uniques_to_infer = [e for e in missing_entries if frozenset(e.items()) not in uniques
                                    and not uniques.add(frozenset(e.items()))]

                new_res_dict = infer_function(self, model_id, uniques_to_infer, infer_params, use_cache)
                logging.info(f"finished running infer for {len(cache_misses)} values")

                new_res_list = [{k: new_res_dict[k][i] for k in new_res_dict.keys()} for i in range(len(uniques))]
                results_by_item = {frozenset(unique_item.items()): item_results for unique_item, item_results
                                   in zip(uniques_to_infer, new_res_list)}
                for idx, entry in zip(cache_misses, missing_entries):
                    item_res = results_by_item[frozenset(entry.items())]
                    infer_res[idx] = item_res
                    self.cache.set(cache_keys[idx], item_res)
                    disk_cache[cache_keys[idx]] = item_res
                save_cache_to_disk(model_cache_file, disk_cache)  # update disk cache

            infer_res_dict = {k: [x[k] for x in infer_res] for k in infer_res[0].keys()}
            return infer_res_dict

    setattr(wrapper, '__wrapper_func__', infer_with_cache.__name__)
    return wrapper



def delete_model_cache(delete_model_function):
    """
    Wrapper for the "infer" call that incorporates both an in-memory cache and a disk cache for inference results
    """
    @functools.wraps(delete_model_function)
    def wrapper(self, model_id):
        if os.path.exists(self.get_prediction_cache_file(model_id)):
            logging.info(f"Deleting prediction cache {self.get_prediction_cache_file(model_id)}")
            os.remove(self.get_prediction_cache_file(model_id))

        return delete_model_function(self, model_id)

    setattr(wrapper, '__wrapper_func__', delete_model_cache.__name__)
    return wrapper