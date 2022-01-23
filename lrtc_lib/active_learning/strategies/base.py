import numpy as np
import random

from lrtc_lib.active_learning.core.active_learning_api import ActiveLearner


class RandomSampling(ActiveLearner):
    def __init__(self, max_to_consider=10 ** 6):
        self.max_to_consider = max_to_consider

    def get_recommended_items_for_labeling(self, workspace_id, model_id, dataset_name, category_name, sample_size=1):
        unlabeled = self.get_unlabeled_data(workspace_id, dataset_name, category_name, self.max_to_consider)
        if len(unlabeled) == 0:
            return unlabeled
        
        scores = self.get_per_element_score(unlabeled, workspace_id, model_id, dataset_name, category_name)
        sample_size = min(sample_size, len(scores)-1)
        indices = np.sort(np.argpartition(scores, sample_size)[:sample_size])
        unlabeled = np.array(unlabeled)[indices]
        return unlabeled.tolist()

    def get_per_element_score(self, items, workspace_id, model_id, dataset_name, category_name):
        # The scores/selected elements are reproducible given the same *items* -
        # i.e., if the same set of elements in the dataset was labeled, the list *items* of unlabeled elements
        # would be identical and the same scores/elements will be returned
        rand = random.Random(0)
        return [rand.random() for _ in range(len(items))]
