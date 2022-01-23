from lrtc_lib.models.core.model_types import ModelTypes
from lrtc_lib.models.policy.model_policy import ModelPolicy


class ModelPolicies(object):
    STATIC_SVM_ENSEMBLE = ModelPolicy(ModelTypes.SVM_ENSEMBLE)
