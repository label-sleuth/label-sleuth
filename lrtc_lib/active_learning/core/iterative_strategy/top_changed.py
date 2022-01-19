import collections
import logging

import numpy as np
from scipy.stats import entropy

from lrtc_lib.active_learning.active_learning_api import ActiveLearner
from lrtc_lib.orchestrator import orchestrator_api
from lrtc_lib.data_access.core.data_structs import LABEL_POSITIVE, LABEL_NEGATIVE
from sleuth_internal_lib.active_learning.strategies import ActiveLearningStrategiesInternal

MAX_INT = 10000000000
MIN_CHANGES = 1
LAST_MODELS = 2


class TopChangedLearner(ActiveLearner):

    def __init__(self, fallback_strategy: ActiveLearner):
        self.fallback_strategy = fallback_strategy

    def get_strategy(self):
        return ActiveLearningStrategiesInternal.ITERATIVE_TOP_PREDICTION_CHANGED

    def get_recommended_items_for_labeling(self, workspace_id, model_id, dataset_name, category_name, sample_size=1):
        # all_models = orchestrator_api.get_all_models_for_category(workspace_id, category_name)
        # if len(all_models) < 4:  # fallback to other strategy
        #     logging.info(f"no 2 or more previous models, falling back {self.fallback_strategy}")
        #     return self.fallback_strategy.get_recommended_items_for_labeling(workspace_id, model_id, dataset_name,
        #                                                                      category_name, sample_size)

        #using query and not get_all_txt_elements as we want to remove duplictes
        all_data = orchestrator_api.query(workspace_id,dataset_name,category_name,None,MAX_INT,False,True)["results"]
        scores = self.get_per_element_score(all_data, workspace_id, model_id, dataset_name, category_name)

        indices = self.get_top_indices(scores, sample_size)

        # indices = np.argpartition(confidences, sample_size)[:sample_size]
        items = np.array(all_data)[indices]
        return items.tolist()

    def get_top_indices(self, scores, k):
        indices = np.argsort(scores)[::-1]
        indices = indices[:k]
        return indices

    def get_per_element_score(self, items, workspace_id, model_id, dataset_name, category_name):

        all_models = orchestrator_api.get_all_models_for_category(workspace_id, category_name)
        logging.info(f"getting the prediction for {len(all_models)} models")
        labels_per_model = []

        for model in list(all_models)[-LAST_MODELS:]:
            infer_res = orchestrator_api.infer(workspace_id, category_name, items, model)
            labels_per_model.append([1 if x == LABEL_POSITIVE else 0 for x in infer_res["labels"]])

        labeled_elements = orchestrator_api.get_all_labeled_text_elements(workspace_id, dataset_name, category_name)
        labeled_set = {x.uri for x in labeled_elements["results"]}
        total_changes_per_element = np.sum(np.abs(np.diff(labels_per_model, axis=0)), axis=0)
        logging.info(f"CHANGED_HISTOGRAM model #\t{len(all_models)}\t{dict(collections.Counter(total_changes_per_element))}")
        scores = []
        total_unlabeled = 0
        total_pass_threshold = 0
        for text_element, num_changes, score in zip(items, total_changes_per_element, infer_res["scores"]):
            if text_element.uri in labeled_set:
                scores.append(-1)
            elif num_changes >= MIN_CHANGES:
                scores.append(entropy(score))
                total_unlabeled += 1
                total_pass_threshold +=1
            else:
                scores.append(-1)
                total_unlabeled += 1
        logging.info(f"CHANGED_HARD_MINING:{total_pass_threshold}/{total_unlabeled}")
        # for text_element, num_changes, score in zip(items, total_changes_per_element, infer_res["scores"]):
        #     if text_element.uri in labeled_set:
        #         scores.append(-1)
        #     elif num_changes >= MIN_CHANGES:
        #         scores.append(num_changes)
        #         total_unlabeled += 1
        #         total_pass_threshold +=1
        #     else:
        #         scores.append(entropy(score))
        #         total_unlabeled += 1
        #logging.info(f"TOTAL_UNLABELED\t{total_unlabeled}\tTOTAL_MORE_THAN_MIN_CHANGED\t{total_pass_threshold}")

        # scores = [
        #     num_changes if text_element.uri not in labeled_set and num_changes >= MIN_CHANGES else entropy(score) for
        #     text_element, num_changes, score in
        #     ]
        return np.array(scores)

        # confidences = self.get_per_element_score(unlabeled, workspace_id, model_id, dataset_name, category_name)
        # indices = np.argpartition(confidences, -sample_size)[-sample_size:]
        # #indices = np.argpartition(confidences, sample_size)[:sample_size]
        # items = np.array(unlabeled)[indices]
        # return items.tolist()
