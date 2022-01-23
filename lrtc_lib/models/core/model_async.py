import abc
import functools
import jsonpickle
import logging
import os
import threading
import traceback
import uuid
from typing import Mapping, Sequence

from lrtc_lib.models.core.languages import Languages, Language
from lrtc_lib.models.core.model_api import ModelAPI, ModelStatus

METADATA_PARAMS_AND_DEFAULTS = {'Language': Languages.ENGLISH}


def update_train_status(async_train_func):
    @functools.wraps(async_train_func)
    def wrapper(self, model_id, *args, **kwargs):
        try:
            async_train_func(self, model_id, *args, **kwargs)
            self.mark_train_as_completed(model_id)
        except Exception as e:
            logging.error(f'model {model_id} failed with exception')
            logging.error(traceback.format_exc())
            self.mark_train_as_error(model_id)
    return wrapper


class ModelAsync(ModelAPI, metaclass=abc.ABCMeta):
    def __init__(self, async_call):
        super().__init__()
        self.async_call = async_call

    def train(self, train_data: Sequence[Mapping], dev_data: Sequence[Mapping],
              train_params: dict) -> str:
        model_id = str(uuid.uuid1())
        args = (train_data, dev_data, train_params)
        self.mark_train_as_started(model_id)
        self.save_metadata(model_id, train_params)
        if self.async_call:
            logging.info(f"starting background thread to wait for training of model {model_id}")
            training_process = threading.Thread(target=self.train_with_async_support, args=(model_id, *args))
            training_process.start()
            return model_id
        else:
            self.train_with_async_support(model_id, *args)
            return model_id

    @abc.abstractmethod
    def train_with_async_support(self, model_id: str, train_data: Sequence[Mapping], dev_data: Sequence[Mapping],
                                 train_params: dict):
        """
        An async implementation of train, that receives a model id from the *train* wrapper and trains a new policy
        for this id. After the training process is complete (this may include inference on *test_data*), this function
        must call *self.mark_train_as_completed*
        """
        self.__raise_not_implemented('train_with_async_support')

    @abc.abstractmethod
    def get_models_dir(self):
        self.__raise_not_implemented('get_models_dir')

    def get_model_dir_by_id(self, model_id):
        return os.path.join(self.get_models_dir(), model_id)

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
        if os.path.isfile(self.get_completed_flag_path(model_id)):
            return ModelStatus.READY
        elif os.path.isfile(self.get_in_progress_flag_path(model_id)):
            return ModelStatus.TRAINING
        return ModelStatus.ERROR

    def get_completed_flag_path(self, model_id):
        return os.path.join(self.get_model_dir_by_id(model_id), f'train_complete_for_{model_id}')

    def get_in_progress_flag_path(self, model_id):
        return os.path.join(self.get_model_dir_by_id(model_id), f'train_in_progress_for_{model_id}')

    def save_metadata(self, model_id, train_params):
        metadata_path = os.path.join(self.get_model_dir_by_id(model_id), 'model_metadata.json')
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
