import shutil
import traceback
from dataclasses import dataclass
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
from lrtc_lib.models.util.disk_cache import load_model_prediction_store_from_disk, save_model_prediction_store_to_disk

PREDICTIONS_CACHE_DIR_NAME = "predictions_cache"
METADATA_PARAMS_AND_DEFAULTS = {'Language': Languages.ENGLISH}


class ModelStatus(Enum):
    TRAINING = 0
    READY = 1
    ERROR = 2
    DELETED = 3


@dataclass
class Prediction:
    """
    Each model.infer should return at least these fields for each element.
    In order to add more fields (e.g embedding), inherit this class and add the desired fields
    """
    label: bool
    score: float

    def __post_init__(self):
        # we make sure to convert numpy objects, which are not json-serializable
        self.label = bool(self.label)
        self.score = float(self.score)


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

    def _disk_store_key_to_in_memory_cache_key(self,model_id, disk_key):
        return (model_id,disk_key)


    def _load_model_prediction_store_to_cache(self,model_id):
        logging.debug("start loading cache from disk")
        model_predictions_store = load_model_prediction_store_from_disk(self.get_model_prediction_store_file(model_id), self.get_prediction_class())
        logging.debug("done loading cache from disk")
        if len(model_predictions_store) > 0:
            for key in model_predictions_store.keys():
                self.cache.set(self._disk_store_key_to_in_memory_cache_key(model_id, key), model_predictions_store[key])
        return model_predictions_store


    def infer(self, model_id, items_to_infer: Sequence[Mapping], use_cache=True) -> Sequence[Prediction]:
        """
        infer a given sequence of elements and return the results
        :param model_id:
        :param items_to_infer: a list of dictionaries with at least the "text" field, additional fields can be passed
        e.g. [{'text': 'text1', 'additional_field': 'value1'}, {'text': 'text2', 'additional_field': 'value2'}]
        :param use_cache: save the inference results to cache. Default is True
        :return: a list of Prediction objects
        """
        if not use_cache:
            logging.info(
                f"Running infer without cache for {len(items_to_infer)} values in {self.__class__.__name__}")
            return self._infer(model_id, items_to_infer)
        if not hasattr(self, "lock"):
            self.lock = threading.Lock()
        with self.lock:
            in_memory_cache_keys = [(model_id, tuple(sorted(item.items()))) for item in items_to_infer]
            model_predictions_store_keys = [tuple(sorted(item.items())) for item in items_to_infer]
            # try to get the predictions from the in-memory cache.
            infer_res = [self.cache.get(cache_key) for cache_key in in_memory_cache_keys]
            indices_not_in_cache = [i for i, v in enumerate(infer_res) if v is None]

            if len(indices_not_in_cache) > 0:  # not in memory cache, loading model prediction store
                logging.info(
                    f"{len(indices_not_in_cache)} not in cache, loading model prediction store from disk"
                    f" in {self.__class__.__name__}")
                model_predictions_store = self._load_model_prediction_store_to_cache(model_id)
                for idx in indices_not_in_cache:
                    infer_res[idx] = self.cache.get(in_memory_cache_keys[idx])
                indices_not_in_cache = [i for i, v in enumerate(infer_res) if v is None]

            if len(indices_not_in_cache) > 0:  # not in memory cache or in model prediction store
                logging.info(
                    f"{len(items_to_infer) - len(indices_not_in_cache)} already in cache, running infer for {len(indices_not_in_cache)}"
                    f" values (cache size {self.cache.get_current_size()}) in {self.__class__.__name__}")
                missing_items_to_infer = [items_to_infer[idx] for idx in indices_not_in_cache]
                uniques = set()
                # if duplicates exist, do not infer the same item more than once
                uniques_to_infer = [e for e in missing_items_to_infer if frozenset(e.items()) not in uniques
                                    and not uniques.add(frozenset(e.items()))]

                new_predictions = self._infer(model_id, uniques_to_infer)
                logging.info(f"finished running infer for {len(indices_not_in_cache)} values")

                text_to_prediction = {frozenset(unique_item.items()): item_predictions for unique_item, item_predictions
                                      in zip(uniques_to_infer, new_predictions)}

                # update cache, model prediction store and infer results with the inferred elements
                for idx, entry in zip(indices_not_in_cache, missing_items_to_infer):
                    prediction = text_to_prediction[frozenset(entry.items())]
                    infer_res[idx] = prediction
                    self.cache.set(in_memory_cache_keys[idx], prediction)
                    model_predictions_store[model_predictions_store_keys[idx]] = prediction
                save_model_prediction_store_to_disk(self.get_model_prediction_store_file(model_id), model_predictions_store)  # update disk cache

            return infer_res


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
    def _infer(self, model_id, items_to_infer: Sequence[Mapping]) -> Sequence[Prediction]:
        """
        TODO
        """

    @abc.abstractmethod
    def _train(self, model_id: str, train_data: Sequence[Mapping], train_params: dict):
        """
        TODO
        """

    @abc.abstractmethod
    def get_models_dir(self):
        """
        TODO
        """

    def delete_model(self, model_id):
        logging.info(f"deleting {self.__class__.__name__} model id {model_id}")
        model_dir = self.get_model_dir_by_id(model_id)
        if os.path.isdir(model_dir):
            shutil.rmtree(model_dir)
        if os.path.exists(self.get_model_prediction_store_file(model_id)):
            logging.info(f"Deleting prediction cache {self.get_model_prediction_store_file(model_id)}")
            os.remove(self.get_model_prediction_store_file(model_id))

    def export_model(self, model_id):
        """
        TODO
        """

    def get_prediction_class(self):
        """
        @return: Prediction class used by the Model. This used for storing and loading the predictions from the disk.

        """
        return Prediction

    def get_model_prediction_store_file(self, model_id):
        return os.path.join(self.get_models_dir(), PREDICTIONS_CACHE_DIR_NAME, model_id + ".json")