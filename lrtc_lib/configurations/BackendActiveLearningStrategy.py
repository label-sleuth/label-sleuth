from enum import Enum

from lrtc_lib.active_learning.strategies import ActiveLearningStrategies


class BackendActiveLearningStrategy(Enum):
    HARD_MINING = ActiveLearningStrategies.HARD_MINING

