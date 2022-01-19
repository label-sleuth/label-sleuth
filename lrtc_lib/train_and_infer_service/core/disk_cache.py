# (c) Copyright IBM Corporation 2020.

# LICENSE: Apache License 2.0 (Apache-2.0)
# http://www.apache.org/licenses/LICENSE-2.0

import ast
import logging
import os
import threading
import time
import ujson

disk_cache_sem = threading.Semaphore()
path_to_cache_dict = dict()
def get_disk_cache(path_to_model_cache) -> dict:
    try:
        disk_cache_sem.acquire()
        if path_to_model_cache in path_to_cache_dict:
            return path_to_cache_dict[path_to_model_cache]
        if not os.path.isfile(path_to_model_cache):
            return {}


        with open(path_to_model_cache) as reader:
            model_cache = ujson.load(reader)
        model_cache = {ast.literal_eval(x): y for x, y in model_cache.items()}
        path_to_cache_dict[path_to_model_cache]=model_cache
    finally:
        disk_cache_sem.release()
    return model_cache


def save_cache_to_disk(path_to_model_cache, model_cache):
    os.makedirs(os.path.dirname(path_to_model_cache), exist_ok=True)
    start = time.time()
    with open(path_to_model_cache, "w") as output_file:
        output_file.write(ujson.dumps(model_cache))
    end = time.time()
    logging.info(f"saving {len(model_cache)} items to disk cache took {end-start}")
