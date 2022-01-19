from enum import Enum

from lrtc_lib.experiment_runners.learning_policies.model.model_policy import ModelPolicy
from lrtc_lib.train_and_infer_service.model_type import ModelTypes


class BackendModelPolicy(Enum):
    STATIC_M_SVM = ModelPolicy(ModelTypes.M_SVM)