#
#  Copyright (c) 2022 IBM Corp.
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#  http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#

from typing import Sequence

from label_sleuth.active_learning.core.active_learning_api import ActiveLearner
from label_sleuth.data_access.core.data_structs import TextElement
from label_sleuth.models.core.prediction import Prediction


class HybridLearner(ActiveLearner):
    """
    Using this module, it possible to combine different active learning strategies. Two source AL modules are used to
    initialize the HybridLearner, and active learning scores for each example are calculated by averaging the
    active learning scores given by the two source modules.
    """
    def __init__(self, active_learner1, active_learner2):
        self.active_learner1 = active_learner1
        self.active_learner2 = active_learner2

    def get_per_element_score(self, candidate_text_elements: Sequence[TextElement],
                              candidate_text_element_predictions: Sequence[Prediction], workspace_id: str,
                              dataset_name: str, category_id: int) -> Sequence[float]:
        scores1 = self.active_learner1.get_per_element_score(candidate_text_elements,
                                                             candidate_text_element_predictions,
                                                             workspace_id, dataset_name, category_id)
        scores2 = self.active_learner2.get_per_element_score(candidate_text_elements,
                                                             candidate_text_element_predictions,
                                                             workspace_id, dataset_name, category_id)
        scores = [(s1 + s2) / 2 for s1, s2 in zip(scores1, scores2)]

        return scores
