import torch

INFER_CACHE_SIZE = 10000000
ACTIVE_LEARNING_SUGGESTION_COUNT = 1000
CPU_WORKERS = 10  # TODO use number of cores?
GPU_AVAILABLE = torch.cuda.is_available()
GPU_WORKERS = 1  # Currently only one GPU is supported










