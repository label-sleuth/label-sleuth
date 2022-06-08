
from label_sleuth.models.core.model_type import ModelType
from label_sleuth.models.policy.model_policy import ModelPolicy


class StaticModelPolicy(ModelPolicy):
    """
    A simple policy that is initialized using a specific classification model type and always returns this model type.
    """

    def __init__(self, model_type: ModelType = None):
        self.static_model = model_type

    def get_model_type(self, iteration_num: int) -> ModelType:
        """
        Ignores *iteration_num* and returns the model type defined in the initialization
        """
        model_type = self.static_model
        if model_type is None:
            raise ValueError('No model type was provided in the initialization')
        return model_type

    def get_name(self):
        return f'Static-{self.static_model.name}'
