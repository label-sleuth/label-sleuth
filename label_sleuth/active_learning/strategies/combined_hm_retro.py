from typing import Sequence
from label_sleuth.active_learning.core.active_learning_api import ActiveLearner
from label_sleuth.data_access.core.data_structs import TextElement
from label_sleuth.models.core.prediction import Prediction
from operator import itemgetter


class CombinedHMRetro(ActiveLearner):
    """
    This active learning module combines "hard" examples, i.e. examples that the model is most uncertain about, 
    with positive confident examples, by selecting them alternately.
    """
    def get_per_element_score(self, candidate_text_elements: Sequence[TextElement],
                              candidate_text_element_predictions: Sequence[Prediction], workspace_id: str,
                              dataset_name: str, category_id: int) -> Sequence[float]:
        hm_scores = [2*(0.5-abs(pred.score-0.5)) for pred in candidate_text_element_predictions]
        hm_indices, hm_sorted = zip(*sorted(enumerate(hm_scores), key=itemgetter(1), reverse=True))
        retro_scores = [pred.score for pred in candidate_text_element_predictions]
        r_indices, r_sorted = zip(*sorted(enumerate(retro_scores), key=itemgetter(1), reverse=True))
        n_elements = len(hm_scores)

        scored_elements = set()
        combined_scores = [0] * n_elements
        highest_score = n_elements
        hm_ind = 0
        r_ind = 0
        while len(scored_elements) < n_elements:
            while hm_indices[hm_ind] in scored_elements:
                hm_ind += 1
            combined_scores[hm_indices[hm_ind]] = highest_score
            scored_elements.add(hm_indices[hm_ind])
            highest_score -= 1
            hm_ind += 1
            if len(scored_elements) < n_elements:
                while r_indices[r_ind] in scored_elements:
                    r_ind += 1
                combined_scores[r_indices[r_ind]] = highest_score
                scored_elements.add(r_indices[r_ind])
                highest_score -= 1
                r_ind += 1
        return [x/n_elements for x in combined_scores]
