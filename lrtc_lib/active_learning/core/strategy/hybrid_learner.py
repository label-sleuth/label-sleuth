import numpy as np

from lrtc_lib.active_learning.active_learning_api import ActiveLearner


class HybridLearner(ActiveLearner):
    def __init__(self, active_learner1, active_learner2, hybrid_name, max_to_consider=10 ** 6):
        self.max_to_consider = max_to_consider
        self.active_learner1 = active_learner1
        self.active_learner2 = active_learner2
        self.strategy = hybrid_name

    def get_strategy(self):
        return self.strategy

    def get_recommended_items_for_labeling(self, workspace_id, model_id, dataset_name, category_name, sample_size=1):
        unlabeled = self.get_unlabeled_data(workspace_id, dataset_name, category_name, self.max_to_consider)
        if len(unlabeled) == 0:
            return unlabeled
        scores = self.get_per_element_score(unlabeled,workspace_id, model_id, dataset_name, category_name)
        indices = np.argpartition(scores, -sample_size)[-sample_size:]
        res = np.array(unlabeled)[indices]
        return res.tolist()

    def get_per_element_score(self, items, workspace_id, model_id, dataset_name, category_name):
        scores1 = self.active_learner1.get_per_element_score(items, workspace_id, model_id, dataset_name, category_name)
        scores2 = self.active_learner2.get_per_element_score(items, workspace_id, model_id, dataset_name, category_name)
        score = scores1*scores2
        return score

