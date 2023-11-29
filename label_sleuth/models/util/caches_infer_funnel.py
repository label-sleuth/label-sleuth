import logging

from label_sleuth.models.util.disk_cache import save_model_prediction_store_to_disk, \
    load_model_prediction_store_from_disk


def get_from_memory_or_disk_or_infer(items_to_infer, cache_lock, memory_cache, item_cache_keys, model_id,
                                     infer_function, prediction_class, model_prediction_store_file):
    """
    try to get the inference results from the in memory cache. If item is not in the in memory cache, read the disk
    cache, if item is not in the disk cache, run inference
    """
    in_memory_cache_keys = [(model_id, key) for key in item_cache_keys]
    with cache_lock:  # we avoid different threads reading and writing to the cache at the same time
        infer_res = [memory_cache.get(cache_key) for cache_key in in_memory_cache_keys]

    indices_not_in_cache = [i for i, v in enumerate(infer_res) if v is None]

    if len(indices_not_in_cache) > 0:  # i.e., some items aren't in the in-memory cache
        logging.info(f"{len(indices_not_in_cache)} not in cache, loading model prediction store from disk "
                     f"in for model {model_id}")
        model_predictions_store = load_model_prediction_store_from_disk(model_prediction_store_file, prediction_class)
        for key, value in model_predictions_store.items():
            memory_cache.set((model_id, key), value)
        logging.info(f"done loading model prediction store from disk for "
                     f"id {model_id}")
        for idx in indices_not_in_cache:
            infer_res[idx] = memory_cache.get(in_memory_cache_keys[idx])
        indices_not_in_cache = [i for i, v in enumerate(infer_res) if v is None]

    if len(indices_not_in_cache) > 0:  # i.e., some items aren't in the in-memory cache or the prediction store
        logging.info(f"model id {model_id}, {len(items_to_infer) - len(indices_not_in_cache)} already in cache,"
                     f" running inference for {len(indices_not_in_cache)} values "
                     f"(cache size {memory_cache.get_current_size()})")
        missing_items_to_infer = [items_to_infer[idx] for idx in indices_not_in_cache]
        # If duplicates exist, do not infer the same item more than once
        uniques = set()
        uniques_to_infer = [e for e in missing_items_to_infer if frozenset(e.items()) not in uniques
                            and not uniques.add(frozenset(e.items()))]

        # Run inference using the model for the missing elements
        new_predictions = infer_function(uniques_to_infer)
        logging.info(f"model id {model_id} finished running infer for {len(indices_not_in_cache)} values")

        item_to_prediction = {frozenset(unique_item.items()): item_predictions
                              for unique_item, item_predictions in zip(uniques_to_infer, new_predictions)}


        # Update cache and prediction store with predictions for the newly inferred elements
        with cache_lock:
            for idx, entry in zip(indices_not_in_cache, missing_items_to_infer):
                prediction = item_to_prediction[frozenset(entry.items())]
                infer_res[idx] = prediction
                memory_cache.set(in_memory_cache_keys[idx], prediction)
                model_predictions_store[item_cache_keys[idx]] = prediction
        save_model_prediction_store_to_disk(model_prediction_store_file,
                                            model_predictions_store)
    return infer_res