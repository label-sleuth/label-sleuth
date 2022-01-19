import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s')

import itertools
import numpy as np

from lrtc_lib.active_learning.active_learning_api import ActiveLearner
from lrtc_lib.active_learning.strategies import ActiveLearningStrategy
from lrtc_lib.orchestrator import orchestrator_api
from lrtc_lib.data_access.core.data_structs import LABEL_POSITIVE, LABEL_NEGATIVE
from sleuth_internal_lib.active_learning.strategies import ActiveLearningStrategiesInternal
from sleuth_internal_lib.analysis_utils.clustering import sib_cluster_with_cache, calc_cluster_pvals

MAX_INT = 10000000000


class SibLabelsOnlyLearner(ActiveLearner):
    def __init__(self,strategy: ActiveLearningStrategy, n_clusters=50):
        self.n_clusters = n_clusters
        self.strategy= strategy

    def get_strategy(self):
        return self.strategy

    def get_recommended_items_for_labeling(self, workspace_id, model_id, dataset_name, category_name, sample_size=1):
        all_uris = orchestrator_api.get_all_text_elements_uris(dataset_name)
        all_data = orchestrator_api.get_text_elements(workspace_id, dataset_name, all_uris)
        p_vals = self.get_per_element_score(all_data, workspace_id, model_id, dataset_name, category_name)
        indices = np.argsort(p_vals)[:sample_size]
        # indices = np.argpartition(confidences, sample_size)[:sample_size]
        items = np.array(all_data)[indices]
        return items.tolist()

    def get_per_element_score(self, items, workspace_id, model_id, dataset_name, category_name):
        positive_set = {x.uri for x in items if category_name in x.category_to_label
                        and next(iter(x.category_to_label[category_name].labels)) == LABEL_POSITIVE}
        negative_set = {x.uri for x in items if category_name in x.category_to_label
                        and next(iter(x.category_to_label[category_name].labels)) == LABEL_NEGATIVE}

        logging.info(f"Active learning clustering {len(items)} elements")
        clusters = sib_cluster_with_cache(dataset_name, self.n_clusters, [x.text for x in items])
        p_vals_by_cluster, p_vals_by_uri = calc_cluster_pvals(clusters=clusters, elements_sent_to_clustering=items,
                                                              target_group_uris=positive_set)

        if self.strategy == ActiveLearningStrategiesInternal.SIB_LABELS_BEST_CLUSTER:
            scores = [p_vals_by_uri[x.uri] if x.uri not in positive_set.union(negative_set)
                      else float('inf') for x in items]

            # # printing for debugging
            # cluster_id_size_pval_and_pos = [(cluster['cluster_id'], len(cluster["argumentInfoContainers"]), p_val)
            #                                 for cluster, p_val in zip(clusters, p_vals_by_cluster)]
            # cluster_id_size_pval_and_pos = sorted(cluster_id_size_pval_and_pos, key=lambda x: x[2])
            # for item in cluster_id_size_pval_and_pos:
            #     logging.debug(f"{item[2]},{item[1]},{item[3]},{item[0]}")

        elif self.strategy == ActiveLearningStrategiesInternal.SIB_LABELS_ROUND_ROBIN_SIG:
            threshold = 0.05
            significant_clusters = [cluster["argumentInfoContainers"] for cluster, cluster_pval
                                    in zip(clusters, p_vals_by_cluster) if cluster_pval < threshold]
            insignificant_clusters = [cluster["argumentInfoContainers"] for cluster, cluster_pval
                                      in zip(clusters, p_vals_by_cluster) if not cluster_pval < threshold]

            # round robin significant clusters
            ordered_elements = \
                [element for group in
                 list(itertools.zip_longest(*significant_clusters)) + list(itertools.zip_longest(*insignificant_clusters))
                 for element in group if element]
            rank = 0
            scores = [float('inf')] * len(items)
            for element in ordered_elements:
                uri = items[element["argument_id"]].uri
                if uri not in positive_set.union(negative_set):
                    scores[element["argument_id"]] = rank
                    rank += 1
                else:
                    scores[element["argument_id"]] = MAX_INT

        else:
            raise Exception(f"Strategy {self.strategy} not supported")

        return np.array(scores)
