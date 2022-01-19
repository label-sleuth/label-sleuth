# (c) Copyright IBM Corporation 2020.

# LICENSE: Apache License 2.0 (Apache-2.0)
# http://www.apache.org/licenses/LICENSE-2.0

import numpy as np

from lrtc_lib.active_learning.active_learning_api import ActiveLearner
from lrtc_lib.active_learning.core.strategy.core_set_utils import CoreSetMIPSampling
from lrtc_lib.active_learning.strategies import ActiveLearningStrategies
from lrtc_lib.data_access.data_access_factory import get_data_access
from lrtc_lib.orchestrator import orchestrator_api


class CoreSetLearner(ActiveLearner):
    def __init__(self, robustness_percentage=10 ** 4, max_to_consider=10 ** 6, greedy=False):
        self.max_to_consider = max_to_consider
        self.greedy = greedy
        self.robustness_percentage = robustness_percentage
        if greedy:
            self.strategy = ActiveLearningStrategies.GREEDY_CORE_SET
        else:
            self.strategy = ActiveLearningStrategies.CORE_SET

    def get_strategy(self):
        return self.strategy

    def get_recommended_items_for_labeling(self, workspace_id, model_id, dataset_name, category_name, sample_size=1):

        data_access = get_data_access()
        unlabeled = self.get_unlabeled_data(workspace_id, dataset_name, category_name, self.max_to_consider)
        if len(unlabeled) == 0:
            return unlabeled

        labeled = data_access.sample_labeled_text_elements(workspace_id, dataset_name, category_name,
                                                           self.max_to_consider)["results"]  # s0 in original paper
        if self.max_to_consider and self.max_to_consider < len(unlabeled):
            unlabeled = unlabeled[:self.max_to_consider]
        X_train = labeled + unlabeled
        labeled_idx = np.array(list(range(len(labeled))))
        if len(labeled) == 0:
            return X_train[list(range(sample_size))]
        sampler = CoreSetMIPSampling(robustness_percentage=self.robustness_percentage, greedy=self.greedy)
        embeddings = np.array(orchestrator_api.infer(workspace_id, category_name, X_train)["embeddings"])
        # embeddings = np.random.random((len(X_train), 756))
        res = sampler.query(X_train=np.array(X_train), labeled_idx=labeled_idx, amount=sample_size,
                            representation=embeddings)
        selected_idx = [idx for idx in res if idx not in set(labeled_idx)]
        res = np.array(X_train)[selected_idx]
        return res.tolist()

    def get_per_element_score(self, items, workspace_id, model_id, dataset_name, category_name):
        raise Exception("get_per_element_score is not supported for coreset")
