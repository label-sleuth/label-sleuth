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

from scipy.stats import entropy

from label_sleuth.active_learning.core.active_learning_api import ActiveLearner
from label_sleuth.data_access.core.data_structs import TextElement
from label_sleuth.models.core.prediction import MulticlassPrediction


class EntropyMulticlassLearner(ActiveLearner):
    """
    This active learning module suggests "hard" examples, i.e. examples that the model is most uncertain about.
    The highest active learning scores are given to examples which were given model scores closest to the
    decision threshold of 0.5.
    """
    def get_per_element_score(self, candidate_text_elements: Sequence[TextElement],
                              candidate_text_element_predictions: Sequence[MulticlassPrediction],
                              workspace_id: str, dataset_name: str, category_id: int) -> Sequence[float]:
        return [entropy(list(pred.scores.values())) for pred in candidate_text_element_predictions]
