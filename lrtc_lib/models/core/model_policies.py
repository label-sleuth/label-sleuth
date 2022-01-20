from enum import Enum

from lrtc_lib.models.core.model_types import ModelTypes
from lrtc_lib.models.policy.model_policy import ModelPolicy


class ModelPolicies(Enum):
    STATIC_SVM_ENSEMBLE = ModelPolicy(ModelTypes.SVM_ENSEMBLE)
