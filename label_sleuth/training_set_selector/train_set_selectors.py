#
#  Copyright (c) 2022 IBM Corp.
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#  http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#

import logging
import random
import sys

from collections import Counter
from typing import Sequence, List

from label_sleuth.data_access.core.data_structs import Label, LabelType, TextElement, BINARY_LABELS, LABEL_POSITIVE, \
    LABEL_NEGATIVE
from label_sleuth.training_set_selector.train_set_selector_api import TrainSetSelectorAPI


class TrainSetSelectorAllLabeled(TrainSetSelectorAPI):
    """
    Implements the basic model training behavior: use all elements labeled by the user - and only those elements -
    for training the model.
    """

    def __init__(self, data_access, background_jobs_manager, label_types=frozenset({LabelType.Standard})):
        super().__init__(data_access, background_jobs_manager, label_types=label_types)

    def get_train_set(self, workspace_id, train_dataset_name, category_id) -> Sequence[TextElement]:
        train_data, train_counts = self.get_data_and_counts_for_labeled(workspace_id, train_dataset_name, category_id,
                                                                        remove_duplicates=True)
        self.verify_all_labels_are_in_train(train_counts)
        logging.info(f"using {len(train_data)} for train using dataset {train_dataset_name}")
        return train_data

    def get_data_and_counts_for_labeled(self, workspace_id, dataset_name, category_id, remove_duplicates=False):
        if dataset_name is None:
            return None, None
        labeled_elements = \
            self.data_access.get_labeled_text_elements(workspace_id=workspace_id, dataset_name=dataset_name,
                                                       category_id=category_id, sample_size=sys.maxsize,
                                                       remove_duplicates=remove_duplicates,
                                                       label_types=self.label_types)["results"]
        labels = [element.category_to_label[category_id].label for element in labeled_elements]
        counts = Counter(labels)

        return labeled_elements, counts

    @staticmethod
    def verify_all_labels_are_in_train(train_counts):
        labels_not_in_train = [label for label in BINARY_LABELS if train_counts[label] == 0]
        if len(labels_not_in_train) > 0:
            raise Exception(
                f"no train examples for labels: {labels_not_in_train}, cannot train a model: {train_counts}")


class TrainSetSelectorEnforcePositiveNegativeRatio(TrainSetSelectorAllLabeled):
    """
    Implements a training behavior that aims to place the ratio between positive and negative examples within a
    predetermined range.
    If the number of negative examples labeled by the user does not meet the minimal ratio, some _unlabeled_ examples
    are added to the train set as negative examples, and are marked as LabelType.Weak; If the number of negative
    examples labeled by the user exceeds the maximal ratio, only a sample of the user-labeled negative examples
    will be sent to the model.
    """
    def __init__(self, data_access, background_jobs_manager, label_types,
                 required_negative_ratio=None, max_negative_ratio=10**6):
        """
        :param data_access
        :param required_negative_ratio: required number of negative samples per positive
        :param max_negative_ratio: maximal allowed number of negative samples per positive
        """
        super().__init__(data_access, background_jobs_manager, label_types)
        self.negative_ratio = required_negative_ratio
        self.max_negative_ratio = max_negative_ratio
        self.neg_label = LABEL_NEGATIVE
        self.pos_label = LABEL_POSITIVE

    def get_train_set(self, workspace_id, train_dataset_name, category_id) -> Sequence[TextElement]:
        train_data, train_counts = self.get_data_and_counts_for_labeled(workspace_id, train_dataset_name, category_id,
                                                                        remove_duplicates=True)
        current_neg_count = train_counts.get(self.neg_label, 0)
        required_neg_count = self.negative_ratio * train_counts[self.pos_label]
        max_neg_count = self.max_negative_ratio * train_counts[self.pos_label]

        if current_neg_count < required_neg_count:
            required_number_of_unlabeled_as_neg = required_neg_count - current_neg_count
            logging.info(f"Trying to add {required_number_of_unlabeled_as_neg} to meet ratio of "
                         f"{self.negative_ratio} negatives per positive")
            # Weak negatives are added according to a fixed order for the specific dataset
            elements_by_order = self.get_weak_negative_candidates(workspace_id, train_dataset_name, category_id)
            weak_negatives_added = 0
            for element in elements_by_order:
                if weak_negatives_added == required_number_of_unlabeled_as_neg:
                    break
                if category_id not in element.category_to_label:  # unlabeled
                    element.category_to_label = {category_id: Label(self.neg_label, label_type=LabelType.Weak)}
                    train_data.append(element)
                    weak_negatives_added += 1
            train_counts[self.neg_label] += weak_negatives_added

        elif current_neg_count > max_neg_count:
            logging.info(f"Too many strong negative elements, sampling to get to a ratio of "
                         f"less than {self.max_negative_ratio} negatives per positive")
            positives = [element for element in train_data
                         if element.category_to_label[category_id].label == self.pos_label]
            shuffled_elements = get_elements_by_selection_order(workspace_id, train_dataset_name, self.data_access)
            negatives_to_keep = [element for element in shuffled_elements if category_id in element.category_to_label
                                 and element.category_to_label[category_id].label == self.neg_label][:max_neg_count]
            train_data = positives + negatives_to_keep
            train_counts[self.neg_label] = len(negatives_to_keep)

        self.verify_all_labels_are_in_train(train_counts)

        logging.info(f"using {len(train_data)} for train using dataset {train_dataset_name}")
        return train_data

    def get_weak_negative_candidates(self, workspace_id, dataset_name, category_id) -> List[TextElement]:
        return get_elements_by_selection_order(workspace_id, dataset_name, self.data_access)


def get_elements_by_selection_order(workspace_id, dataset_name, data_access):
    dataset_uris = sorted(data_access.get_all_text_elements_uris(dataset_name))
    random_seed = sum([ord(c) for c in dataset_name])
    random.Random(random_seed).shuffle(dataset_uris)
    elements_by_order = data_access.get_text_elements_by_uris(workspace_id=workspace_id, dataset_name=dataset_name,
                                                              uris=dataset_uris)
    return elements_by_order
