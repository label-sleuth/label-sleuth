import numpy as np

from lrtc_lib.active_learning.active_learning_api import ActiveLearner
from lrtc_lib.active_learning.strategies import ActiveLearningStrategies
from lrtc_lib.orchestrator import orchestrator_api


class EGLSampling(ActiveLearner):
    """
    An implementation of the EGL query strategy.
    """

    def __init__(self, max_to_consider=10 ** 6):
        self.max_to_consider = max_to_consider

    def get_strategy(self):
        return ActiveLearningStrategies.GRADIENT_LENGTH

    def get_recommended_items_for_labeling(self, workspace_id, model_id, dataset_name, category_name, sample_size=1):
        unlabeled = self.get_unlabeled_data(workspace_id, dataset_name, category_name, self.max_to_consider)
        if len(unlabeled) == 0:
            return unlabeled
        egls = self.get_per_element_score(unlabeled, workspace_id, model_id, dataset_name, category_name)
        indices = np.argpartition(egls, -sample_size)[-sample_size:]
        unlabeled = np.array(unlabeled)[indices]
        return unlabeled.tolist()

    def get_per_element_score(self, items, workspace_id, model_id, dataset_name, category_name):
        infer_results = orchestrator_api.infer(workspace_id, category_name, items, infer_params={"with-grads": True})
        egls = infer_results["grads"]
        return egls
