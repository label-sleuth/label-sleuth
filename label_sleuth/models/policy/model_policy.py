import abc

from label_sleuth.models.core.model_type import ModelType


class ModelPolicy(object, metaclass=abc.ABCMeta):
    """
    Base class for implementing a model policy, that determines which type of classification model will be used.
    Policies can be static, i.e. always return the same model type, or dynamic, i.e. a different model type is returned
    depending on the current iteration.
    """

    @abc.abstractmethod
    def get_model_type(self, iteration_num: int) -> ModelType:
        """
        Given *iteration_num*, return the type of classification model to be used
        :param iteration_num:
        :return: a member of the ModelTypes enum
        """

    @abc.abstractmethod
    def get_name(self) -> str:
        """
        :return: a name that describes the policy
        """
