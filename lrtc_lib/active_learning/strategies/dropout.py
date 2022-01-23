import numpy as np

from lrtc_lib.active_learning.core.active_learning_api import ActiveLearner
from lrtc_lib.orchestrator import orchestrator_api


class DropoutLearner(ActiveLearner):
    def __init__(self, max_to_consider=10 ** 6):
        self.max_to_consider = max_to_consider

    def get_recommended_items_for_labeling(self, workspace_id, model_id, dataset_name, category_name, sample_size=1):
        unlabeled = self.get_unlabeled_data(workspace_id, dataset_name, category_name, self.max_to_consider)
        if len(unlabeled) == 0:
            return unlabeled
        unlabeled_predictions = self.get_per_element_score(unlabeled, workspace_id, model_id, dataset_name, category_name)
        selected_indices = np.argpartition(unlabeled_predictions, -sample_size)[-sample_size:]
        unlabeled = np.array(unlabeled)[selected_indices]
        return unlabeled.tolist()

    def compute_from_vectors(self, orig_items_len, single_output):
        output_split = [single_output[i: i + orig_items_len] for i in range(0, len(single_output), orig_items_len)]
        mean_predictions = np.mean(np.array(output_split), axis=0)
        unlabeled_predictions = mean_predictions * np.log(mean_predictions + 1e-10) + \
                                (1-mean_predictions) * np.log(1-mean_predictions + 1e-10)
        return unlabeled_predictions

    def get_per_element_score(self, items, workspace_id, model_id, dataset_name, category_name):
        iter_num = 10
        extended_items = items * iter_num

        single_output = orchestrator_api.infer(workspace_id, category_name, extended_items,
                                               infer_params={"infer_with_dropout_seed": 51}, use_cache=False)["scores"]
        orig_items_len = len(items)
        unlabeled_predictions = self.compute_from_vectors(orig_items_len, single_output)
        return 1-unlabeled_predictions


if __name__ == '__main__':
    dl = DropoutLearner()
    items = np.random.rand(10).tolist()
    print(dl.compute_from_vectors(5, items))
