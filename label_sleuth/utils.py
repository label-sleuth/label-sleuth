
import time
import logging
import functools
from flask import g 

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
        This filter add the request_id to every the LogRecord object with level ERROR 
    '''
    def filter(self, record: logging.LogRecord):
        # if record.levelname == logging.ERROR:
        record.request_id = g.request_id[:8]
        return True


def configure_app_logger():
    '''
        Configures the Label Sleuth modules logging (i.e. modules under label_sleuth).
        Modules should log using `logger = logging.getLogger(__name__)` initialized 
        at the beginning of the module. Using logging.log() uses the root logger instead
    '''
    logger = logging.getLogger('label_sleuth')

    handler = logging.StreamHandler()
    formatter = logging.Formatter('[request_id: %(request_id)s] %(asctime)s %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s')
    handler.setFormatter(formatter)
    handler.addFilter(AddRequestIdFilter())
    
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

    # Don't propagate logs to the root logger (if true, would duplicate)
    logger.propagate = False

