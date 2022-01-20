import numpy as np
from scipy.stats import entropy

from lrtc_lib.active_learning.active_learning_api import ActiveLearner
from lrtc_lib.active_learning.strategies import ActiveLearningStrategies
from lrtc_lib.orchestrator import orchestrator_api
import logging


class HardMiningLearner(ActiveLearner):
    def __init__(self, max_to_consider=10 ** 6):
        self.max_to_consider = max_to_consider

    def get_strategy(self):
        return ActiveLearningStrategies.HARD_MINING

    def get_recommended_items_for_labeling(self, workspace_id, model_id, dataset_name, category_name, sample_size=1):
        unlabeled = self.get_unlabeled_data(workspace_id, dataset_name, category_name, self.max_to_consider)
        if len(unlabeled) == 0:
            return unlabeled

        entropy_scores = self.get_per_element_score(unlabeled, workspace_id, model_id, dataset_name, category_name)
        indices = list(reversed(np.argsort(entropy_scores)[-sample_size:]))
        #indices = np.argpartition(confidences, sample_size)[:sample_size]
        items = np.array(unlabeled)[indices]
        # comment out before commit
        logging.debug(f"top hard mining active learning recommendations {workspace_id}:{category_name}:")
        for idx,item in enumerate(items):
            logging.debug(f"{idx}. {item.text}")
        return items.tolist()

    def get_per_element_score(self, items, workspace_id, model_id, dataset_name, category_name):
        scores = orchestrator_api.infer(workspace_id, category_name, items)["scores"]

        entropy_all = np.array([entropy(score) for score in scores]) # == 0.5 - np.abs(np.array([x[1] for x in scores]) - 0.5)
        #larger_diff = [first-second for x in scores for second,first in [np.partition(x, -2)[-2:]] ]
        return entropy_all
