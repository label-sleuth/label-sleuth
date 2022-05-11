import abc
from typing import Sequence

from lrtc_lib.data_access.core.data_structs import TextElement
from lrtc_lib.models.core.prediction import Prediction


class ActiveLearner:
    """
    Base class for implementing an active learning module.
    """
    @abc.abstractmethod
    def get_recommended_items_for_labeling(self, workspace_id: str, dataset_name: str, category_name: str,
                                           candidate_text_elements: Sequence[TextElement],
                                           candidate_text_element_predictions: Sequence[Prediction],
                                           sample_size: int = 1) -> Sequence[TextElement]:
        """
        Returns a batch of *sample_size* elements suggested by the active learning module,
        for a given dataset and category, based on the model predictions for a sequence of candidate text elements.
        :param workspace_id:
        :param dataset_name:
        :param category_name:
        :param candidate_text_elements:
        :param candidate_text_element_predictions:
        :param sample_size: number of suggested elements to return
        """

    @abc.abstractmethod
    def get_per_element_score(self, candidate_text_elements: Sequence[TextElement],
                              candidate_text_element_predictions: Sequence[Prediction],
                              workspace_id: str, dataset_name: str, category_name: str) -> Sequence[float]:
        """
        For a a given sequence of TextElements and their model predictions, return a score for each element
        from the active learning module.
        :param candidate_text_elements:
        :param candidate_text_element_predictions:
        :param workspace_id:
        :param dataset_name:
        :param category_name:
        """
