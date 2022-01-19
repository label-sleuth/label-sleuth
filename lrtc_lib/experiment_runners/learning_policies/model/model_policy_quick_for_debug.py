from lrtc_lib.train_and_infer_service.model_type import ModelType
from sleuth_internal_lib.experiment_runners.learning_policies.model.model_policy import ModelPolicy
from sleuth_internal_lib.train_and_infer_service.model_type import ModelTypesInternal


class ModelPolicyQuickDebug(ModelPolicy):

    def get_model(self, iteration_num: int) -> ModelType:
        if iteration_num <= 1:
            model = ModelTypesInternal.RAND
        else:
            model = ModelTypesInternal.NB_OVER_BOW
        return model
