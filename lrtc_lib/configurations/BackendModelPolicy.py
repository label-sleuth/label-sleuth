from enum import Enum

from lrtc_lib.models.core.model_type import ModelTypes
from lrtc_lib.models.policy.model_policy import ModelPolicy


class BackendModelPolicy(Enum):
    STATIC_M_SVM = ModelPolicy(ModelTypes.M_SVM)