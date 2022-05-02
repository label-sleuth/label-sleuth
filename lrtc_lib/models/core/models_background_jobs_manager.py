import logging

from concurrent.futures.thread import ThreadPoolExecutor

from lrtc_lib.definitions import CPU_WORKERS, GPU_WORKERS


class ModelsBackgroundJobsManager():
    def __init__(self):
        self.cpu_executor = ThreadPoolExecutor(CPU_WORKERS,thread_name_prefix=f"CPU_{CPU_WORKERS}_threadpool")
        self.gpu_executor = ThreadPoolExecutor(GPU_WORKERS,thread_name_prefix=f"GPU_{GPU_WORKERS}_threadpool")

    def add_training(self, model_id, train_method, train_args, use_gpu, done_callback):
        executor = self.get_executor(use_gpu)
        future = executor.submit(train_method, *train_args)

        logging.info(f"adding training for model id {model_id} into the {executor._thread_name_prefix}")

        if done_callback is not None:
            future.add_done_callback(done_callback)
        return future

    def add_inference(self, model_id, infer_method, infer_args, use_gpu, done_callback):
        executor = self.get_executor(use_gpu)

        future = executor.submit(infer_method, *infer_args)
        logging.info(f"adding inference for model id {model_id} into the {executor._thread_name_prefix}")
        if done_callback is not None:
            future.add_done_callback(done_callback)

    def get_executor(self, model_requested_gpu):
        if model_requested_gpu and GPU_WORKERS > 0:
            return self.gpu_executor
        return self.cpu_executor


