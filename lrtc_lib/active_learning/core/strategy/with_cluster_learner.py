import numpy as np
from sklearn.neighbors import NearestNeighbors

from lrtc_lib.active_learning.active_learning_api import ActiveLearner
from sleuth_internal_lib.active_learning.cluster_calculator import ClusterCalculator
from lrtc_lib.orchestrator import orchestrator_api


class WithClusterLearner(ActiveLearner):
    def __init__(self, active_learner, hybrid_name, max_to_consider=10 ** 6):
        self.max_to_consider = max_to_consider
        self.active_learner = active_learner
        self.strategy = hybrid_name

    def get_strategy(self):
        return self.strategy

    def get_recommended_items_for_labeling(self, workspace_id, model_id, dataset_name, category_name, sample_size=1):
        unlabeled = self.get_unlabeled_data(workspace_id, dataset_name, category_name, self.max_to_consider)
        if len(unlabeled) == 0:
            return unlabeled
        scores = self.active_learner.get_per_element_score(unlabeled, workspace_id, model_id, dataset_name, category_name)
        indices = np.argpartition(scores, -10*sample_size)[-10*sample_size:]
        unlabeled = np.array(orchestrator_api.infer(workspace_id, category_name, unlabeled)["embeddings"])
        items_to_cluster = np.array(unlabeled)[indices]
        scores, closest_to_cluster_idx = self.select_top_idx(items_to_cluster, sample_size)
        # scores, closest_to_cluster_idx = self.select_closest_to_centers(items_to_cluster,cc,sample_size)
        res = np.array(unlabeled)[indices[closest_to_cluster_idx]]
        return res.tolist()

    def select_top_idx(self, items_to_cluster, sample_size):
        cc = ClusterCalculator(items_to_cluster, n_clusters=sample_size)
        centers = cc.get_centers()
        self.nbrs = NearestNeighbors(n_neighbors=1, algorithm='ball_tree').fit(items_to_cluster)
        distances, indices = self.nbrs.kneighbors(centers)
        distances = 1 - distances / np.max(distances)
        return np.squeeze(distances), np.squeeze(indices)

    # def select_closest_to_centers(self, items_to_cluster, cc, sample_size):
    #     scores = cc.get_per_element_score(items_to_cluster)
    #     scores = 1 - scores / np.max(scores)
    #     closeset_to_cluster_idx = np.argpartition(scores, -sample_size)[-sample_size:]
    #     return scores[closeset_to_cluster_idx],closeset_to_cluster_idx


if __name__ == '__main__':
    all_data = np.random.rand(15000, 70)
    selected = all_data[0:300, :]
    cc = ClusterCalculator(selected, 50)
    wcl = WithClusterLearner(None)
    print(len(wcl.select_closest_per_centers(selected, cc)[0]))
