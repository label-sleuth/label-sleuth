from typing import List
import numpy as np

from lrtc_lib.models.core.model_type import ModelType, ModelTypes
from lrtc_lib.models.policy.model_policy import ModelPolicy


class ModelChangingPolicy(ModelPolicy):
    """
    a policy choosing models, switching each model after n_iterations iterations.
    """

    def __init__(self, models: List[ModelType] = (
            ModelTypes.SVM_OVER_BOW, ModelTypes.DEBATER_HF_BERT_REINIT_1_LAYERS),
                 n_iterations: List[int] = (1,)):
        super().__init__(models[-1])
        assert len(models) == len( # TODO fix assertion message? replace to Exception?
            n_iterations) + 1, f"Each policy but the last should define when is it replaced models num {len(models)}, iterations used num {len(n_iterations)}"
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
