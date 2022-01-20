import abc
import logging
from typing import Sequence

from lrtc_lib.active_learning.strategies import ActiveLearningStrategies
from lrtc_lib.data_access.core.data_structs import TextElement


class ActiveLearner:

    @abc.abstractmethod
    def get_strategy(self) -> ActiveLearningStrategies:
        raise NotImplementedError("API functions should not be called")

    @abc.abstractmethod
    def get_recommended_items_for_labeling(self, workspace_id: str, model_id: str, dataset_name: str,
                                           category_name: str, sample_size: int = 1) -> Sequence[TextElement]:
        """
        Returns a batch of *sample_size* elements suggested by the active learning module,
        for a given dataset and category, based on the outputs of model *model_id*
        :param workspace_id:
        :param model_id:
        :param dataset_name:
        :param category_name:
        :param sample_size: number of suggested elements to return
        """
        raise NotImplementedError("API functions should not be called")

    def get_per_element_score(self, items: Sequence[TextElement], workspace_id: str, model_id: str, dataset_name: str,
                              category_name: str) -> Sequence[float]:
        """
        Optional. For a a given sequence of TextElements, return scores per element by the AL module
        :param items:
        :param workspace_id:
        :param model_id:
        :param dataset_name:
        :param category_name:
        """
        raise NotImplementedError("API functions should not be called")

    def get_unlabeled_data(self, workspace_id: str, dataset_name: str, category_name: str, max_to_consider: int) \
            -> Sequence[TextElement]:
        """
        Return a list of up to *max_to_consider* elements that are unlabeled for a given dataset and category.
        :param workspace_id:
        :param dataset_name:
        :param category_name:
        :param max_to_consider:
        """
        from lrtc_lib.data_access.data_access_factory import get_data_access
        data_access = get_data_access()
        unlabeled = data_access.sample_unlabeled_text_elements(workspace_id, dataset_name, category_name,
                                                               max_to_consider, remove_duplicates=True)["results"]
        logging.info(f"Got {len(unlabeled)} unlabeled elements for active learning")
        return unlabeled
