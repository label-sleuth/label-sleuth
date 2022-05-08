import os
import torch

INFER_CACHE_SIZE = 10000000
ACTIVE_LEARNING_SUGGESTION_COUNT = 1000
CPU_WORKERS = 10  # TODO use number of cores?
GPU_AVAILABLE = torch.cuda.is_available()
GPU_WORKERS = 1  # Currently only one GPU is supported


# TODO change to output dir and use across the system instead of using os.path.join(ROOT_DIR) everywhere
ROOT_DIR = os.path.abspath(os.path.join(os.path.abspath(__file__), os.pardir))
WORKSPACE_DATA_DIR = os.path.normpath(os.path.join(ROOT_DIR, "output/workspaces"))

if not os.path.exists(WORKSPACE_DATA_DIR):
    os.makedirs(WORKSPACE_DATA_DIR)









