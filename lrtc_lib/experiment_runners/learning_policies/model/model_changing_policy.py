from typing import List

from lrtc_lib.train_and_infer_service.model_type import ModelType
from sleuth_internal_lib.experiment_runners.learning_policies.model.model_policy import ModelPolicy
from sleuth_internal_lib.train_and_infer_service.model_type import ModelTypesInternal
import numpy as np


class ModelChangingPolicy(ModelPolicy):
    """
    a policy choosing models, switching each model after n_iterations iterations.
    """

    def __init__(self, models: List[ModelType] = (
            ModelTypesInternal.SVM_OVER_BOW, ModelTypesInternal.DEBATER_HF_BERT_REINIT_1_LAYERS),
                 n_iterations: List[int] = (1,)):
        super().__init__(models[-1])
        assert len(models) == len(
            n_iterations) + 1, f"Each model but the last should define when is it replaced models num {len(models)}, iterations used num {len(n_iterations)}"
        self.models = models
        self.n_iterations = n_iterations
        self.cum_iterations = np.cumsum(n_iterations)

    def get_model(self, iteration_num: int) -> ModelType:
        for i, iterations in enumerate(self.cum_iterations):
            if iteration_num < iterations:
                return self.models[i]
        return self.models[-1]

    def get_name(self):
        if len(self.models) == 1:
            return super(ModelChangingPolicy, self).get_name()
        name = ""
        for model, n_iter in zip(self.models, self.n_iterations):
            name += f'{model.name}x{n_iter}-'
        name += f"{self.models[-1].name}"
        return name
