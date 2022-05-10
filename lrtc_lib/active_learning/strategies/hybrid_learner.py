import numpy as np
from typing import Sequence

from lrtc_lib.data_access.core.data_structs import TextElement
from lrtc_lib.models.core.model_api import Prediction
from lrtc_lib.active_learning.core.active_learning_api import ActiveLearner


class HybridLearner(ActiveLearner):
    """
    Using this module, it possible to combine different active learning strategies. Two source AL modules are used to
    initialize the HybridLearner, and active learning scores for each example are calculated by multiplying the
    active learning scores given by the two source modules.
    """
    def __init__(self, active_learner1, active_learner2):
        self.active_learner1 = active_learner1
        self.active_learner2 = active_learner2

    def get_recommended_items_for_labeling(self, workspace_id, dataset_name, category_name,
                                           candidate_text_elements: Sequence[TextElement],
                                           candidate_text_element_predictions: Sequence[Prediction], sample_size=1):

        scores = self.get_per_element_score(candidate_text_elements, candidate_text_element_predictions, workspace_id,
                                            dataset_name, category_name)
        sorted_indices = np.argsort(scores)[::-1]
        top_indices = sorted_indices[:sample_size]
        res = np.array(candidate_text_elements)[top_indices]
        return res.tolist()

    def get_per_element_score(self, candidate_text_elements: Sequence[TextElement],
                              candidate_text_element_predictions: Sequence[Prediction], workspace_id: str,
                              dataset_name: str, category_name: str) -> Sequence[float]:
        scores1 = self.active_learner1.get_per_element_score(candidate_text_elements,
                                                             candidate_text_element_predictions,
                                                             workspace_id, dataset_name, category_name)
        scores2 = self.active_learner2.get_per_element_score(candidate_text_elements,
                                                             candidate_text_element_predictions,
                                                             workspace_id, dataset_name, category_name)
        scores = [(s1 + s2) / 2 for s1, s2 in zip(scores1,scores2)]

        return scores
