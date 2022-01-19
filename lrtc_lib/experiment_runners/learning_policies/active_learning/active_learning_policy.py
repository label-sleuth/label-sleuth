import abc

from lrtc_lib.active_learning.strategies import ActiveLearningStrategy


class ActiveLearningPolicy(object, metaclass=abc.ABCMeta):

    def __init__(self, active_learning: ActiveLearningStrategy = None):
        self.static_active_learning_strategy = active_learning

    def get_active_learning_strategy(self, iteration_num: int) -> ActiveLearningStrategy:
        """

        :param iteration_num: zero is base model, i>0 is after the i-th active learning iteration
        :return:
        """
        active_learning_strategy = self.static_active_learning_strategy
        if active_learning_strategy is None:
            raise ValueError('no active learning strategy was provided in the initialization')
        return active_learning_strategy

    def get_name(self):
        if self.__class__.__name__ != ActiveLearningPolicy.__name__:
            name = 'Policy'
            for i in range(3):
                name += f'-{self.get_active_learning_strategy(i+1).name}'
            return name
        else:
            return f'Static-{self.static_active_learning_strategy.name}'
