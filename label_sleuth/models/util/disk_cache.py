import ast
import dataclasses
import logging
import os
import time

from typing import Dict, Tuple, Type

import ujson

from label_sleuth.models.core.prediction import Prediction


def load_model_prediction_store_from_disk(path_to_store: str, prediction_class: Type[Prediction]) \
        -> Dict[Tuple, Prediction]:
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
    res =  {k: prediction_class(**v) for k, v in model_prediction_store.items()}

    return res

def save_model_prediction_store_to_disk(path_to_store: str, model_cache: Dict[Tuple, Prediction]):
    """
    Convert a dict of model predictions to json and save to disk
    :param path_to_store: path to a predictions json
    :param model_cache: a mapping from store keys in the form (('text', element_text),) to Prediction dataclass objects
    (or classes inheriting from the Prediction dataclass).
    """
    os.makedirs(os.path.dirname(path_to_store), exist_ok=True)
    start = time.time()
    model_cache = {k: dataclasses.asdict(v) for k, v in model_cache.items()}
    with open(path_to_store, "w") as output_file:
        output_file.write(ujson.dumps(model_cache))
    end = time.time()
    logging.info(f"saving {len(model_cache)} items to model prediction store on disk took {end-start}")

