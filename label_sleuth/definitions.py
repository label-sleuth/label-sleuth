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

import torch

INFER_CACHE_SIZE = 10000000
ACTIVE_LEARNING_SUGGESTION_COUNT = 1000
CPU_WORKERS = 10  # TODO use number of cores?
MPS_GPU_AVAILABLE = torch.backends.mps.is_available()  # relevant for mac machines with GPU devices (e.g., Apple M1 chip)
GPU_AVAILABLE = torch.cuda.is_available() or MPS_GPU_AVAILABLE
GPU_WORKERS = 1  # Currently only one GPU is supported










