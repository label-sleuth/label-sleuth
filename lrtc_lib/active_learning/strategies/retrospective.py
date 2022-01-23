import numpy as np

from lrtc_lib.orchestrator import orchestrator_api
from lrtc_lib.active_learning.core.active_learning_api import ActiveLearner


class RetrospectiveLearner(ActiveLearner):
    def __init__(self, max_to_consider=10 ** 6):
        self.max_to_consider = max_to_consider

    def get_recommended_items_for_labeling(self, workspace_id, model_id, dataset_name, category_name, sample_size=1):
        unlabeled = self.get_unlabeled_data(workspace_id, dataset_name, category_name, self.max_to_consider)
        if len(unlabeled) == 0:
            return unlabeled

        # a list containing either one list of scores or several lists of scores (in the case of ensemble model)
        scores = self.get_per_element_score(unlabeled, workspace_id, model_id, dataset_name, category_name)

        indices = []
        for model_scores in scores:
            model_top = self.get_top_indices(model_scores, sample_size)
            indices.append(model_top)
        unique = set()
        # in case of ensemble model, we add the indices of the top predictions for each model
        flat_indices = [x for sublist in list(zip(*indices)) for x in sublist if x not in unique and not unique.add(x)]
        top_indices = flat_indices[:sample_size]

        unlabeled = np.array(unlabeled)[np.array(top_indices)]
        return unlabeled.tolist()

    def get_top_indices(self, scores, k):
        indices = np.argsort(scores)[::-1]
        indices = indices[:k]
        return indices

    def get_per_element_score(self, items, workspace_id, model_id, dataset_name, category_name):
        infer = orchestrator_api.infer(workspace_id, category_name, items)
        if "scores0" not in infer:
            return [[x[1] for x in infer["scores"]]]
        i = 0
        scores = []
        while f"scores{i}" in infer:
            cur_scores = [x[1] for x in infer[f"scores{i}"]]
            scores.append(cur_scores)
            i += 1
        return scores
