from collections import Counter
from typing import Sequence, Mapping, Tuple
import logging
import sys

from label_sleuth.data_access.core.data_structs import TextElement
from label_sleuth.training_set_selector.train_set_selector_api import TrainSetSelectorAPI


class TrainSetSelectorMulticlassAllLabeled(TrainSetSelectorAPI):

    def get_data_and_counts_for_labeled(self, workspace_id, dataset_name, category_id, remove_duplicates=False):
        if dataset_name is None:
            return None, None
        labeled_elements = \
            self.data_access.get_labeled_text_elements(workspace_id=workspace_id, dataset_name=dataset_name,
                                                       category_id=category_id, sample_size=sys.maxsize,
                                                       remove_duplicates=remove_duplicates,
                                                       label_types=self.label_types)["results"]
        labels = [element.label.label for element in labeled_elements]
        counts = Counter(labels)

        return labeled_elements, counts

    def get_train_set(self, workspace_id: str, train_dataset_name: str,
                      cat_id_to_name_and_desc: Mapping[int, Tuple]) -> Sequence[TextElement]:
        if len(cat_id_to_name_and_desc) <= 1:
            raise Exception(f"workspace '{workspace_id}' {self.__class__.__name__} expects 2 or more classes, "
                            f"got {len(cat_id_to_name_and_desc)}")
        train_data, train_counts = self.get_data_and_counts_for_labeled(workspace_id, train_dataset_name, None,
                                                                        remove_duplicates=True)
        # if self.should_verify_all_labels_in_train:
        #     self.verify_all_labels_are_in_train(train_counts)
        logging.info(f"using {len(train_data)} for train using dataset {train_dataset_name}")
        return train_data
