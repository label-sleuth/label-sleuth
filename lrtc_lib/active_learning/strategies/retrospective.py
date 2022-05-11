import numpy as np
from typing import Sequence

from lrtc_lib.data_access.core.data_structs import TextElement
from lrtc_lib.models.core.prediction import Prediction

from lrtc_lib.active_learning.core.active_learning_api import ActiveLearner


class RetrospectiveLearner(ActiveLearner):
    """
    This active learning module suggests examples that the model predicts as positive with high confidence. Thus,
    the scores given to examples by the active learner are identical to the model score for the positive class.
    """
    def get_recommended_items_for_labeling(self, workspace_id, dataset_name, category_name,
                                           candidate_text_elements: Sequence[TextElement],
                                           candidate_text_element_predictions: Sequence[Prediction], sample_size=1):
        scores = self.get_per_element_score(candidate_text_elements, candidate_text_element_predictions, workspace_id,
                                            dataset_name, category_name)
        sorted_indices = np.argsort(scores)[::-1]
        top_indices = sorted_indices[:sample_size]
        recommended_items = np.array(candidate_text_elements)[np.array(top_indices)].tolist()
        return recommended_items

    def get_per_element_score(self, candidate_text_elements: Sequence[TextElement],
                              candidate_text_element_predictions: Sequence[Prediction], workspace_id: str,
                              dataset_name: str, category_name: str) -> Sequence[float]:
        return [pred.score for pred in candidate_text_element_predictions]
