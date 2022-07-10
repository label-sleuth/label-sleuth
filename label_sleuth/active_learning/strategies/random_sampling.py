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

import random

from typing import Sequence

from label_sleuth.active_learning.core.active_learning_api import ActiveLearner
from label_sleuth.data_access.core.data_structs import TextElement
from label_sleuth.models.core.prediction import Prediction


class RandomSampling(ActiveLearner):
    """
    This module assigns random (but reproducible) scores for the given examples. Thus, using this active learning module
    equates to randomly selecting the next examples for labeling.
    """
    def get_per_element_score(self, candidate_text_elements: Sequence[TextElement],
                              candidate_text_element_predictions: Sequence[Prediction], workspace_id: str,
                              dataset_name: str, category_id: int) -> Sequence[float]:
        # The scores/selected elements are reproducible given the same *candidate_text_elements* -
        # i.e., if the same set of elements in the dataset was labeled, the list *candidate_text_elements*
        # of unlabeled elements would be identical and the same scores/elements will be returned
        rand = random.Random(0)
        return [rand.random() for _ in range(len(candidate_text_element_predictions))]
