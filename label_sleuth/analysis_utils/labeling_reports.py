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

import itertools
import logging
import random
import time
from collections import defaultdict
from typing import List, Mapping, Tuple

import numpy as np
from sklearn.neighbors import NearestNeighbors

from label_sleuth.analysis_utils.analyze_tokens import get_token_overlap
from label_sleuth.data_access.core.data_structs import LABEL_POSITIVE, LABEL_NEGATIVE, TextElement, BINARY_LABELS
from label_sleuth.models.core.languages import Language
from label_sleuth.models.core.catalog import ModelsCatalog
from label_sleuth.models.core.tools import remove_stop_words_and_punctuation
from label_sleuth.orchestrator.utils import convert_text_elements_to_train_data

MIN_TOKEN_OVERLAP_THRESHOLD = 0.6


def get_disagreements_using_cross_validation(workspace_id, category_id: int, labeled_elements: List[TextElement],
                                             model_factory, language: Language, model_type=ModelsCatalog.SVM_ENSEMBLE,
                                             num_folds=4):
    """
    This method uses cross-validation in order to identify elements where the user label might be incorrect.
    The *labeled elements* are divided into *num_folds* parts. In each fold, one part is left out and the other parts
    are used to train a model; Then, the model for each fold outputs predictions for the left out elements. Where one
    of the models gives a confident prediction for an element that disagrees with the user label for that element,
    the user label is considered suspect.

    :param workspace_id:
    :param category_id:
    :param labeled_elements:
    :param model_factory:
    :param language:
    :param model_type: the type of model used for training and inference.
    :param num_folds: determines the number of partitions of the labeled elements, and thus the number of models
    that will be trained.
    :return: a list of labeled text elements, sorted from most to least "suspicious" according to the confidence of the
    model predictions
    """
    start_time = time.time()
    if {text_element.category_to_label[category_id].label for text_element in labeled_elements} != BINARY_LABELS:
        # if there are no positive labels or no negative labels, return an empty list
        return []
    model_api = model_factory.get_model_api(model_type)

    all_scores = []
    random.Random(0).shuffle(labeled_elements)
    all_train_data = convert_text_elements_to_train_data(labeled_elements, category_id)
    train_splits = np.array_split(np.array(all_train_data), num_folds)
    if any({x["label"] for x in train_splits[idx]} != BINARY_LABELS for idx in range(num_folds)):
        # if there are no positive labels or no negative labels in one of the folds, return an empty list
        return []
    for i in range(num_folds):
        # train split i is used for inference and left out of the train data
        left_out_data = train_splits[i]
        fold_train_data = \
            np.concatenate([part for j, part in enumerate(train_splits) if j != i])
        model_id, future = model_api.train(fold_train_data, language=language)
        logging.info(f'Suspicious labels report fold {i}: training cross-validation model {model_id}')
        future.result(timeout=60)
        logging.info(f'Suspicious labels report fold {i}: done waiting for cross-validation model {model_id}, '
                     f'inferring on {len(left_out_data)} left-out examples')
        fold_scores = [pred.score for pred in model_api.infer_by_id(model_id, left_out_data, use_cache=False)]
        all_scores.extend(fold_scores)
        model_api.delete_model(model_id)
    # We take elements where the fold model disagreed with the user label, but ignore model predictions that are close
    # to the decision boundary of 0.5
    disagreement_scores_and_elements = \
        [(score, element) for score, element, element_dict in zip(all_scores, labeled_elements, all_train_data)
         if score < 0.4 and element_dict['label'] == 1 or score > 0.6 and element_dict['label'] == 0]
    # sort elements by model confidence
    sorted_scores_and_elements = sorted(disagreement_scores_and_elements, key=lambda x: abs(x[0] - 0.5),
                                        reverse=True)
    sorted_disagreement_elements = [text_element for score, text_element in sorted_scores_and_elements]
    logging.info(f"creating suspicious labels report for category_id '{category_id}' in workspace '{workspace_id}' "
                 f"took {'{:.2f}'.format(time.time() - start_time)} seconds")
    return sorted_disagreement_elements


def get_suspected_labeling_contradictions_by_distance_with_diffs(category_id: int, labeled_elements, embedding_func,
                                                                 language: Language) -> Mapping[str, List]:
    """
    Enrich the output of possibly inconsistent element pairs from *get_suspected_labeling_contradictions_by_distance*
    with sets of tokens that differentiate the pair of elements, to enable highlighting the similarities/differences
    between the texts in each pair.

    :param category_id:
    :param labeled_elements:
    :param embedding_func: a function that receives a list of texts and a language, and returns a list of embedding
    vectors for those texts.
    :param language:
    :return: a dictionary containing:
    {'pairs': the list of text element pairs from get_suspected_labeling_contradictions_by_distance,
    i.e. [[pair_1_element_a, pair_1_element_b], [pair_2_element_a, pair_2_element_b], ...],
    'diffs': a list of tuples with the tokens unique to the first and the second element of each pair, respectively,
    i.e. [(pair_1_element_a_unique_tokens_set, pair_1_element_b_unique_tokens_set), ...]
    """
    pairs = get_suspected_labeling_contradictions_by_distance(category_id, labeled_elements, embedding_func, language)
    diffs = []
    for pair in pairs:
        set1 = set(pair[0].text.split())
        set2 = set(pair[1].text.split())
        intersect = set1.intersection(set2)
        diffs.append((set1 - intersect, set2 - intersect))
    return {'pairs': pairs, 'diffs': diffs}


def get_suspected_labeling_contradictions_by_distance(category_id, labeled_elements: List[TextElement],
                                                      embedding_func, language: Language) \
        -> List[List[TextElement]]:
    """
    This method uses text embeddings in order to identify user labels that may be inconsistent with each other.
    For each of the *labeled_elements*, we identify a nearest neighbor that was given the opposite label.
    Where the similarity between the pair of opposite-label elements is high, we suspect that one of the pair elements
    may have been given the wrong label.

    :param category_id:
    :param labeled_elements:
    :param embedding_func: a function that receives a list of texts and a language, and returns a list of embedding
    vectors for those texts.
    :param language:
    :return: a list of text element pairs, sorted from high to low similarity between the pair text embeddings.
    """
    if {text_element.category_to_label[category_id].label for text_element in labeled_elements} != BINARY_LABELS:
        # if there are no positive labels or no negative labels, return an empty list
        return []

    embedding_vectors = embedding_func([e.text for e in labeled_elements], language=language)
    sorted_pair_lists = []
    # for each positively labeled element we find the nearest neighbor with a negative label, and vice versa
    for source_label in [LABEL_POSITIVE, LABEL_NEGATIVE]:
        distances_and_pairs = _get_nearest_neighbors_with_opposite_label(labeled_elements, embedding_vectors,
                                                                         category_id, source_label=source_label)
        sorted_element_pairs = [element_pair for distance, element_pair
                                in sorted(distances_and_pairs, key=lambda x: x[0])]  # sort by distance
        sorted_pair_lists.append(sorted_element_pairs)

    # interleave positive-to-negative and negative-to-positive neighbor pairs
    unified_pairs_list = [tup for subset in itertools.zip_longest(*sorted_pair_lists) for tup in subset
                          if tup is not None]
    # filter duplicates and low-overlap pairs
    unified_pairs_list = _filter_nearest_neighbor_pairs(unified_pairs_list, language=language)
    # align pairs by label
    unified_pairs_list = [sorted(pair, key=lambda te: te.category_to_label[category_id].label, reverse=True)
                          for pair in unified_pairs_list]
    return unified_pairs_list


def _get_nearest_neighbors_with_opposite_label(all_elements: List[TextElement], embedding_vectors: List, category_id,
                                               source_label) -> List[Tuple[float, Tuple[TextElement, TextElement]]]:
    source_label_idxs = [i for i, (element, rep) in enumerate(zip(all_elements, embedding_vectors))
                         if element.category_to_label[category_id].label == source_label and rep[0] != 0]
    opposite_label_idxs = [i for i, (element, rep) in enumerate(zip(all_elements, embedding_vectors))
                           if element.category_to_label[category_id].label != source_label and rep[0] != 0]
    source_label_embeddings = np.array(embedding_vectors)[source_label_idxs]
    opposite_label_embeddings = np.array(embedding_vectors)[opposite_label_idxs]

    nbrs = NearestNeighbors(n_neighbors=1, algorithm='ball_tree').fit(opposite_label_embeddings)
    distances_to_closest_opposite, indices_of_closest_opposite = nbrs.kneighbors(source_label_embeddings)

    distances_to_closest_opposite = [d[0] for d in distances_to_closest_opposite] # one neighbor for each element
    indices_of_closest_opposite = [d[0] for d in indices_of_closest_opposite]

    distances_and_pairs = \
        [(distance,
          (all_elements[source_label_idxs[i]], all_elements[opposite_label_idxs[opposite_neighbor_idx]]))
         for i, (distance, opposite_neighbor_idx) in enumerate(zip(distances_to_closest_opposite,
                                                                   indices_of_closest_opposite))]
    return distances_and_pairs


def _filter_nearest_neighbor_pairs(pairs_list: List[Tuple[TextElement]], language: Language):
    """
    :param pairs_list: a list of tuples of TextElements, where the element in tuple index 1 is the nearest neighbor of
    the element in tuple index 0
    :param language:
    :return: a subset of pairs_list, preserving the order from the original list
    """
    # remove duplicate pairs
    unique_pairs = set()
    filtered_pairs_list = [(element_a, element_b) for element_a, element_b in pairs_list
                           if frozenset({element_a.uri, element_b.uri}) not in unique_pairs
                           and not unique_pairs.add(frozenset({element_a.uri, element_b.uri}))]

    # remove pairs with low token overlap
    filtered_pairs_list = \
        [(element_a, element_b) for element_a, element_b in filtered_pairs_list
         if get_token_overlap(*remove_stop_words_and_punctuation([element_a.text, element_b.text], language=language))
         > MIN_TOKEN_OVERLAP_THRESHOLD]

    # remove elements that appear too many times (currently this is a maximum of 3 appearances: each element can appear
    # once as a source element, and 0-2 times as a nearest neighbor to another source element)
    uri_counts = defaultdict(lambda: 0)
    filtered_pairs_list = [(source_element, neighbor) for source_element, neighbor in filtered_pairs_list
                           if uri_counts[neighbor.uri] <= 1 and not uri_counts.update({neighbor.uri:
                                                                                           uri_counts[
                                                                                               neighbor.uri] + 1})]
    return filtered_pairs_list
