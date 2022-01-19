import functools
import logging
from multiprocessing import Process, Queue


def wrap_as_process(function):
    """Using tensorflow as part of an active learning module can lead to problems related to parallel processes in a
    tensorflow-based train_and_infer. In order to avoid this, use the wrapper to run the relevant part of the AL module
    as a separate process. Due to limitations of the python 'multiprocessing' module, the wrapped function cannot be
    one that returns very large or unpickleable objects (e.g. a keras policy object, or a list of very large tensors)"""

    @functools.wraps(function)
    def wrapper(*args, **kwargs):
        def process_wrapper(q, *args, **kwargs):
            func_result = function(*args, **kwargs)
            q.put(func_result)

        q = Queue()
        p = Process(target=process_wrapper, args=(q, *args), kwargs=kwargs)
        logging.info(f'running function {function} as a separate process')
        p.start()
        p.join()
        logging.info(f'done waiting for join for function {function} to complete')
        result = q.get()
        return result

    return wrapper
