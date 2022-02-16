import ast
import logging
import os
import time
import ujson
import dataclasses


def load_model_prediction_store_from_disk(path_to_model_cache, cls) -> dict:
    """
    @param path_to_model_cache:
    @param cls: Class of the model prediction object. Usually of type Prediction.
    @return:
    """

    if not os.path.isfile(path_to_model_cache):
        return {}

    with open(path_to_model_cache) as reader:
        model_prediction_store = ujson.load(reader)
    return {ast.literal_eval(x): cls(**y) for x, y in model_prediction_store.items()}


def save_model_prediction_store_to_disk(path_to_model_cache, model_cache):
    os.makedirs(os.path.dirname(path_to_model_cache), exist_ok=True)
    start = time.time()
    model_cache = {k: dataclasses.asdict(v) for k, v in model_cache.items()}
    with open(path_to_model_cache, "w") as output_file:
        output_file.write(ujson.dumps(model_cache))
    end = time.time()
    logging.info(f"saving {len(model_cache)} items to model prediction store on disk took {end-start}")

