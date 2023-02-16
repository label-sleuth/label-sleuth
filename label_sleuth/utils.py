
import time
import logging
import functools

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