from typing import Sequence

import numpy as np
import random

from lrtc_lib.active_learning.core.active_learning_api import ActiveLearner
from lrtc_lib.data_access.core.data_structs import TextElement
from lrtc_lib.models.core.model_api import Prediction


class RandomSampling(ActiveLearner):

    def get_recommended_items_for_labeling(self, workspace_id, dataset_name, category_name,
                                           candidate_text_elements: Sequence[TextElement],
                                           candidate_text_element_predictions: Sequence[Prediction], sample_size=1):

        scores = self.get_per_element_score(candidate_text_elements, candidate_text_element_predictions, workspace_id,
                                            dataset_name, category_name)
        sample_size = min(sample_size, len(scores)-1)
        indices = np.sort(np.argpartition(scores, sample_size)[:sample_size])
        unlabeled = np.array(candidate_text_elements)[indices]
        return unlabeled.tolist()

    def get_per_element_score(self, candidate_text_elements: Sequence[TextElement],
                              candidate_text_element_predictions: Sequence[Prediction], workspace_id: str,
                              dataset_name: str, category_name: str) -> Sequence[float]:
        # The scores/selected elements are reproducible given the same *candidate_text_elements* -
        # i.e., if the same set of elements in the dataset was labeled, the list *candidate_text_elements*
        # of unlabeled elements would be identical and the same scores/elements will be returned
        rand = random.Random(0)
        return [rand.random() for _ in range(len(candidate_text_element_predictions))]
