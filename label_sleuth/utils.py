
import time
import logging
import functools
import uuid

import jsonpickle
from flask import jsonify

logger = logging.getLogger(__name__)
NEW_JSONPICKLE_TAG = "jsonpickle_v3"


def log_runtime(function):
    @functools.wraps(function)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        
        res = function(*args, **kwargs)

        end_time = time.time()
        total_time = round(end_time - start_time, 2)
        
        logging.info(f'{function.__name__} took {total_time} seconds, {round(total_time/60, 2)} minutes')

        return res

    return wrapper


class AddRequestIdFilter:
    """
    This filter add the error_id to every the LogRecord object with level ERROR
    """
    def filter(self, record: logging.LogRecord):
        if record.levelno == logging.ERROR:
            record.error_id = record.error_id[:8]
            return True
        else:
            return False


class ErrorLogsFilter:
    """
    This filter discards the logs with level ERROR
    """
    def filter(self, record: logging.LogRecord):
        return record.levelno < logging.ERROR


def make_error(error, code: int = 400):
    """
    Adds the error_id to the response and logs it
    """
    error_id = uuid.uuid4().hex
    error['error_id'] = error_id
    logger.error(f"[error_id: {error_id[:8]}] {error['type']}: {error['title']}", extra={'error_id': error_id})
    return jsonify(error), code


def jsonpickle_decode(json_str, **decode_kwargs):
    """
    Due to breaking changes in jsonpickle (https://github.com/jsonpickle/jsonpickle/issues/364), old files need to be
    decoded in a special way.
    """
    is_current_jsonpickle = NEW_JSONPICKLE_TAG in json_str  # tag used in current jsonpickle_encode() function
    if not is_current_jsonpickle:
        obj = jsonpickle.decode(json_str, v1_decode=True, **decode_kwargs)
    else:
        obj, _ = jsonpickle.decode(json_str, **decode_kwargs)
    return obj


def jsonpickle_encode(obj, **encode_kwargs):
    obj_with_tag = (obj, NEW_JSONPICKLE_TAG)  # we add tag to show this was created with a new version of jsonpickle
    return jsonpickle.encode(obj_with_tag, **encode_kwargs)
