from lrtc_lib.train_and_infer_service.model_type import ModelType
from sleuth_internal_lib.experiment_runners.learning_policies.model.model_policy import ModelPolicy
from sleuth_internal_lib.train_and_infer_service.model_type import ModelTypesInternal


class ModelPolicySimpleFirst(ModelPolicy):

    def get_model(self, iteration_num: int) -> ModelType:
        if iteration_num <= 1:
            model = ModelTypesInternal.SVM_OVER_BOW
        else:
            model = ModelTypesInternal.DEBATER_HF_BERT_REINIT_1_LAYERS
        return model
