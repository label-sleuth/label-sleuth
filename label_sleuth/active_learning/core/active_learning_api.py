import abc

from typing import Sequence

import numpy as np

from label_sleuth.data_access.core.data_structs import TextElement
from label_sleuth.models.core.prediction import Prediction


class ActiveLearner:
    """
    Base class for implementing an active learning module.
    """
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
        scores = self.get_per_element_score(candidate_text_elements, candidate_text_element_predictions,
                                            workspace_id, dataset_name, category_name)
        sorted_indices = np.argsort(scores)[::-1]
        top_indices = sorted_indices[:sample_size]
        recommended_items = np.array(candidate_text_elements)[np.array(top_indices)].tolist()
        return recommended_items

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
