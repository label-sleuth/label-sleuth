import abc

from lrtc_lib.models.core.model_type import ModelType


class ModelPolicy(object, metaclass=abc.ABCMeta):

    def __init__(self, model: ModelType = None):
        self.static_model = model

    def get_model(self, iteration_num: int) -> ModelType:
        """

        :param iteration_num:
        :return: ignores input and returns the static policy defined in the initialization
        """
        model = self.static_model
        if model is None:
            raise ValueError('no policy was provided in the initialization')
        return model

    def get_name(self):
        if self.__class__.__name__ != ModelPolicy.__name__:
            name = 'Policy'
            for i in range(3):
                name += f'-{self.get_model(i+1).name}'
            return name
        else:
            return f'Static-{self.static_model.name}'
