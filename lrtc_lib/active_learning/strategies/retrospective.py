from typing import Sequence

from lrtc_lib.active_learning.core.active_learning_api import ActiveLearner
from lrtc_lib.data_access.core.data_structs import TextElement
from lrtc_lib.models.core.prediction import Prediction


class RetrospectiveLearner(ActiveLearner):
    """
    This active learning module suggests examples that the model predicts as positive with high confidence. Thus,
    the scores given to examples by the active learner are identical to the model score for the positive class.
    """
    def get_per_element_score(self, candidate_text_elements: Sequence[TextElement],
                              candidate_text_element_predictions: Sequence[Prediction], workspace_id: str,
                              dataset_name: str, category_name: str) -> Sequence[float]:
        return [pred.score for pred in candidate_text_element_predictions]
