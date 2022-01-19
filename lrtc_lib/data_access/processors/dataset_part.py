# (c) Copyright IBM Corporation 2020.

# LICENSE: Apache License 2.0 (Apache-2.0)
# http://www.apache.org/licenses/LICENSE-2.0

from enum import Enum


class DatasetPart(Enum):
    TRAIN = 0
    DEV = 1
    TEST = 2