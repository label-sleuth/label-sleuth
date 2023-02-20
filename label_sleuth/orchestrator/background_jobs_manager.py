#
#  Copyright (c) 2022 IBM Corp.
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#  http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#

import logging

from concurrent.futures import Future
from concurrent.futures.thread import ThreadPoolExecutor

from label_sleuth.definitions import CPU_WORKERS, GPU_WORKERS, GPU_AVAILABLE


class BackgroundJobsManager:
    """
    This class manages various jobs that are submitted in the background (for example, training and inference).
    The number of jobs running on CPU/GPU at the same time is limited by the CPU_WORKERS/GPU_WORKERS parameters.
    """
    def __init__(self):
        self.cpu_executor = ThreadPoolExecutor(CPU_WORKERS, thread_name_prefix=f"CPU_{CPU_WORKERS}_threadpool")
        self.gpu_executor = ThreadPoolExecutor(GPU_WORKERS, thread_name_prefix=f"GPU_{GPU_WORKERS}_threadpool")

    def add_background_job(self, method, args, use_gpu, done_callback) -> Future:
        executor = self.get_executor(use_gpu)
        future = executor.submit(method, *args)

        logging.info(f"Adding background job {method} into the {executor._thread_name_prefix}")

        if done_callback is not None:
            future.add_done_callback(done_callback)
        return future

    def get_executor(self, model_requested_gpu) -> ThreadPoolExecutor:
        if model_requested_gpu and GPU_WORKERS > 0 and GPU_AVAILABLE:
            return self.gpu_executor
        return self.cpu_executor
