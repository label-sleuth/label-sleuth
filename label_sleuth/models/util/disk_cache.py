import dataclasses
import logging
import os
import time

from typing import Type, Union

import ujson

from label_sleuth.models.core.prediction import Prediction


def load_model_prediction_store_from_disk(path_to_store: str, prediction_class: Type[Prediction]) \
        -> dict[tuple, Prediction]:
    """
    Load predictions for a particular model from a json file
    :param path_to_store: path to a predictions json
    :param prediction_class: class of the model prediction object. Usually of type Prediction.
    :return: a mapping from store keys in the form (('text', element_text),) to *prediction_class* objects.
    """

    if not os.path.isfile(path_to_store):
        return {}
    with open(path_to_store) as reader:
        model_prediction_store = ujson.load(reader)
    if dataclasses.is_dataclass(prediction_class):
        res = {k: prediction_class(**v) for k, v in model_prediction_store.items()}
    else:
        res = model_prediction_store
    return res


def save_model_prediction_store_to_disk(path_to_store: str, model_cache: dict[tuple, Union[Prediction, list]]):
    """
    Convert a dict of model predictions to json and save to disk
    :param path_to_store: path to a predictions json
    :param model_cache: a mapping from store keys in the form (('text', element_text),) to Prediction dataclass objects
    (or classes inheriting from the Prediction dataclass).
    """
    os.makedirs(os.path.dirname(path_to_store), exist_ok=True)
    start = time.time()
    first_value = next(iter(model_cache.values()))
    if dataclasses.is_dataclass(first_value):
        model_cache = {k: dataclasses.asdict(v) for k, v in model_cache.items()}
    elif not isinstance(first_value, list):
        raise Exception(f"type {type(first_value)} is not supported by the disk cache yet")
    with open(path_to_store, "w") as output_file:
        output_file.write(ujson.dumps(model_cache))
    end = time.time()
    logging.info(f"saving {len(model_cache)} items to model prediction store on disk took {end-start}")

