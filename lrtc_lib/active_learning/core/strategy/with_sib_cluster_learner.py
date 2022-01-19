import numpy as np

from sleuth_internal_lib.active_learning.core.strategy.with_cluster_learner import WithClusterLearner
from sleuth_internal_lib.active_learning.skmeans_clusters_vectors import hartigan_k_means_cluster_min_distance_by_texts


class WithSibClusterLearner(WithClusterLearner):
    def __init__(self, active_learner, hybrid_name, max_to_consider=10 ** 6):
        super().__init__(active_learner, max_to_consider)
        self.strategy = hybrid_name

    def get_strategy(self):
        return self.strategy

    def get_recommended_items_for_labeling(self, workspace_id, model_id, dataset_name, category_name, sample_size=1):
        unlabeled = self.get_unlabeled_data(workspace_id, dataset_name, category_name, self.max_to_consider)
        if len(unlabeled) == 0:
            return unlabeled
        scores = self.active_learner.get_per_element_score(unlabeled, workspace_id, model_id, dataset_name, category_name)
        #sample_size=2
        indices = np.argpartition(scores, -5*sample_size)[-5*sample_size:]
        #len(unlabeled)=100
        # indices [0,10,20,50,90,22,33,44,55,66]
        #TODO we can infer only for 5*sample_size
        #unlabeled = np.array(orchestrator_api.infer(workspace_id, category_name, items)["embeddings"])
        items_to_cluster = np.array([x.text for x in unlabeled])[indices].tolist()
        #len(items_to_cluster)=10
        scores, closeset_to_cluster_idx = hartigan_k_means_cluster_min_distance_by_texts(items_to_cluster, sample_size)
        # len(scores)=samples_size=len(indices)/5=2=closeset_to_cluster_idx
        res = np.array(unlabeled)[indices[closeset_to_cluster_idx]]
        return res.tolist()
