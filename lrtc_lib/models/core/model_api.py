import shutil
import traceback
from enum import Enum
from typing import Dict
import abc
import jsonpickle
import logging
import os
import threading

import uuid
from typing import Mapping, Sequence

from lrtc_lib.models.core.languages import Languages, Language

import lrtc_lib.definitions as definitions
from lrtc_lib.models.util.LRUCache import LRUCache
from lrtc_lib.models.util.disk_cache import get_disk_cache, save_cache_to_disk

PREDICTIONS_CACHE_DIR_NAME = "predictions_cache"
METADATA_PARAMS_AND_DEFAULTS = {'Language': Languages.ENGLISH}


class ModelStatus(Enum):
    TRAINING = 0
    READY = 1
    ERROR = 2
    DELETED = 3


class ModelAPI(object, metaclass=abc.ABCMeta):
    def __init__(self):
        self.cache = LRUCache(definitions.INFER_CACHE_SIZE)

    def train(self, train_data: Sequence[Mapping], train_params: dict) -> str:
        """
        start training in a background thread and returns a unique model identifier that will be used for inference.
        :param train_data: a list of dictionaries with at least the "text" and "label" fields, additional fields can be
        passed e.g. [{'text': 'text1', 'label': 1, 'additional_field': 'value1'}, {'text': 'text2', 'label': 0,
        'additional_field': 'value2'}]
        :param train_params: dictionary for additional train parameters (can be None)
        :rtype: model_id unique id
        """
        model_id = f"{self.__class__.__name__}_{str(uuid.uuid1())}"
        args = (train_data, train_params)
        self.mark_train_as_started(model_id)
        self.save_metadata(model_id, train_params)

        logging.info(f"starting background thread to train model id {model_id} of type {self.__class__.__name__}")
        # TODO move to Threadpool to avoid too many trainings at the same time
        training_process = threading.Thread(target=self.train_and_update_status, args=(model_id, *args))
        training_process.start()
        return model_id

    def train_and_update_status(self, model_id, *args):
        try:
            self._train(model_id, *args)
            self.mark_train_as_completed(model_id)
        except Exception:
            logging.exception(f'model {model_id} failed with exception')
            logging.error(traceback.format_exc())
            self.mark_train_as_error(model_id)

        return

    def infer(self, model_id, items_to_infer: Sequence[Mapping], use_cache=True) -> Dict:
        """
        infer a given sequence of elements and return the results
        :param model_id:
        :param items_to_infer: a list of dictionaries with at least the "text" field, additional fields can be passed
        e.g. [{'text': 'text1', 'additional_field': 'value1'}, {'text': 'text2', 'additional_field': 'value2'}]
        :param use_cache: save the inference results to cache. Default is True
        :rtype: dictionary with at least the "labels" key where the value is a list of numeric labels for each element
        in items_to_infer, additional keys (with list values of the same length) can be passed
         e.g {"labels": [1,0], "gradients": [[0.24,-0.39,-0.66,0.25], [0.14,0.29,-0.26,0.16]]
        """
        if not use_cache:
            logging.info(
                f"Running infer without cache for {len(items_to_infer)} values in {self.__class__.__name__}")
            return self._infer(model_id, items_to_infer)
        if not hasattr(self, "lock"):
            self.lock = threading.Lock()
        with self.lock:
            cache_keys = [(model_id, tuple(sorted(item.items()))) for item in items_to_infer]
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

                new_res_dict = self._infer(model_id, uniques_to_infer)
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


    def mark_train_as_started(self, model_id):
        os.makedirs(self.get_model_dir_by_id(model_id), exist_ok=True)
        with open(self.get_in_progress_flag_path(model_id), 'w') as f:
            pass

    def mark_train_as_completed(self, model_id):
        with open(self.get_completed_flag_path(model_id), 'w') as f:
            pass
        os.remove(self.get_in_progress_flag_path(model_id))

    def mark_train_as_error(self, model_id):
        os.remove(self.get_in_progress_flag_path(model_id))

    def get_model_status(self, model_id):
        """
        return one of:
        ModelStatus.TRAINING - for async mode implementations only
        ModelStatus.READY - model is ready
        ModelStatus.ERROR - training error

        :rtype: ModelStatus
        :param model_id:
        """
        if os.path.isfile(self.get_completed_flag_path(model_id)):
            return ModelStatus.READY
        elif os.path.isfile(self.get_in_progress_flag_path(model_id)):
            return ModelStatus.TRAINING
        return ModelStatus.ERROR

    def get_model_dir_by_id(self, model_id):
        return os.path.join(self.get_models_dir(), model_id)

    def get_completed_flag_path(self, model_id):
        return os.path.join(self.get_model_dir_by_id(model_id), f'train_complete_for_{model_id}')

    def get_in_progress_flag_path(self, model_id):
        return os.path.join(self.get_model_dir_by_id(model_id), f'train_in_progress_for_{model_id}')

    def save_metadata(self, model_id, train_params):
        metadata_path = os.path.join(self.get_model_dir_by_id(model_id), 'model_metadata.json')
        if train_params is None:
            model_metadata = METADATA_PARAMS_AND_DEFAULTS
        else:
            model_metadata = {key: train_params.get(key, default) for key, default in METADATA_PARAMS_AND_DEFAULTS.items()}
        with open(metadata_path, 'w') as f:
            f.write(jsonpickle.encode(model_metadata))

    def get_metadata(self, model_id):
        metadata_path = os.path.join(self.get_model_dir_by_id(model_id), 'model_metadata.json')
        with open(metadata_path, 'r') as f:
            metadata = jsonpickle.decode(f.read())
        return metadata

    def get_language(self, model_id) -> Language:
        return self.get_metadata(model_id)['Language']

    @abc.abstractmethod
    def _infer(self, model_id, items_to_infer: Sequence[Mapping]) -> Dict:
        self.__raise_not_implemented('_infer')

    @abc.abstractmethod
    def _train(self, model_id: str, train_data: Sequence[Mapping], train_params: dict):
        self.__raise_not_implemented('_train')

    @abc.abstractmethod
    def get_models_dir(self):
        self.__raise_not_implemented('get_models_dir')

    def delete_model(self, model_id):
        logging.info(f"deleting {self.__class__.__name__} model id {model_id}")
        model_dir = self.get_model_dir_by_id(model_id)
        if os.path.isdir(model_dir):
            shutil.rmtree(model_dir)
        if os.path.exists(self.get_prediction_cache_file(model_id)):
            logging.info(f"Deleting prediction cache {self.get_prediction_cache_file(model_id)}")
            os.remove(self.get_prediction_cache_file(model_id))

    def export_model(self, model_id):
        raise NotImplementedError(f'export function has not been implemented for {self.__class__.__name__}')

    def __raise_not_implemented(self, func_name):
        raise NotImplementedError('users must define ' + func_name + ' to use this base class')

    def get_prediction_cache_file(self, model_id):
        return os.path.join(self.get_models_dir(), PREDICTIONS_CACHE_DIR_NAME, model_id + ".json")