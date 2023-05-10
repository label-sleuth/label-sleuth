
import time
import logging
import functools
import uuid
from flask import jsonify

logger = logging.getLogger(__name__)

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

class AddRequestIdFilter():
    '''
        This filter add the error_id to every the LogRecord object with level ERROR 
    '''
    def filter(self, record: logging.LogRecord):
        if record.levelno == logging.ERROR:
            record.error_id = record.error_id[:8]
            return True
        else: return False


class ErrorLogsFilter():
    '''
        This filter discard the logs with level ERROR 
    '''
    def filter(self, record: logging.LogRecord):
        return record.levelno < logging.ERROR


def make_error(error, code: int = 400):
    '''
    Adds the error_id to the response and logs it
    '''
    error_id = uuid.uuid4().hex
    error['error_id'] = error_id
    logger.error(f"[error_id: {error_id[:8]}] {error['type']}: {error['title']}", extra={'error_id': error_id})
    return jsonify(error), code

