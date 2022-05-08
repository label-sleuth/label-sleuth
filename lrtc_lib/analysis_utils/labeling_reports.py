import itertools
import logging
import random
import time
from collections import defaultdict
from typing import List, Tuple

import numpy as np
from sklearn.neighbors import NearestNeighbors

from lrtc_lib.data_access.core.data_structs import LABEL_POSITIVE, LABEL_NEGATIVE, LabelType
from lrtc_lib.factories import MODEL_FACTORY
from lrtc_lib.models.core.languages import Languages
from lrtc_lib.models.core.model_api import ModelStatus
from lrtc_lib.models.core.model_types import ModelTypes
from lrtc_lib.models.core.tools import get_glove_representation, remove_stop_words_and_punctuation
from lrtc_lib.orchestrator.utils import _convert_text_elements_to_train_data
from lrtc_lib.training_set_selector.train_set_selector_api import \
    TrainingSetSelectionStrategy
from lrtc_lib.training_set_selector.training_set_selector_factory import get_training_set_selector


MIN_OVERLAP_THRESHOLD = 0.4


def get_disagreements_using_cross_validation(workspace_id, dataset_name, category_name,
                                             model_type=ModelTypes.SVM_ENSEMBLE,
                                             selector=TrainingSetSelectionStrategy.ALL_LABELED,
                                             language=Languages.ENGLISH):
    start_time = time.time()
    train_set_selector = get_training_set_selector(selector=selector)
    all_train_text_elements = train_set_selector.get_train_set(
        workspace_id=workspace_id, train_dataset_name=dataset_name,
        category_name=category_name)
    model = MODEL_FACTORY.get_model(model_type)

    num_folds = 4
    random.Random(0).shuffle(all_train_text_elements)
    all_train_data = _convert_text_elements_to_train_data(all_train_text_elements, category_name)
    train_splits = np.array_split(np.array(all_train_data), num_folds)
    all_pos_scores = []
    for i in range(num_folds):
        fold_train_data = np.concatenate([part for j, part in enumerate(train_splits) if j != i])
        mid,_ = model.train(fold_train_data, {'Language': language})
        logging.info(f'*** waiting for cross-validation model {mid} ***')
        while model.get_model_status(mid) == ModelStatus.TRAINING:  # TODO find proper fix
            time.sleep(0.1)

        logging.info(f'*** done waiting for cross-validation model {mid} ***')
        scores = [pred.score for pred in model.infer(mid, all_train_data)]
        # only look at scores of strong labeled elements from the current validation fold
        # TODO each element has only one scores so we can concatenate one vector instead of mean of one value?
        scores = [score if element_dict in train_splits[i]
                              and element.category_to_label[category_name].label_type == LabelType.Standard else np.nan
                  for element_dict, element, score in zip(all_train_data, all_train_text_elements, scores)]
        model.delete_model(mid)
        all_pos_scores.append(scores)
    pos_scores = np.nanmean(all_pos_scores, axis=0)
    disagreement_scores_and_elements = \
        [(score, text_element) for score, text_element, element_dict in
         zip(pos_scores, all_train_text_elements, all_train_data)
         if score < 0.4 and element_dict['label'] == 1 or score > 0.6 and element_dict['label'] == 0]
    sorted_scores_and_elements = sorted(disagreement_scores_and_elements, key=lambda x: abs(x[0] - 0.5),
                                        reverse=True)
    sorted_disagreement_elements = [x[1] for x in sorted_scores_and_elements]
    logging.info(f"creating suspicious labels report for category '{category_name}' in workspace '{workspace_id}' "
                 f"took {'{:.2f}'.format(time.time() - start_time)}")
    return sorted_disagreement_elements


def get_suspected_labeling_contradictions_by_distance_with_diffs(labeled_elements, category_name):
    pairs = get_suspected_labeling_contradictions_by_distance(labeled_elements, category_name)
    pairs_with_diff = []
    for pair in pairs:
        set1 = set(pair[0].text.split())
        set2 = set(pair[1].text.split())
        intesect = set1.intersection(set2)
        pairs_with_diff.append((pair[0], set1-intesect, pair[1], set2-intesect))
    return pairs_with_diff


def get_suspected_labeling_contradictions_by_distance(labeled_elements, category_name,
                                                      embedding_func=get_glove_representation,
                                                      language=Languages.ENGLISH):

    sent_reps = embedding_func([e.text for e in labeled_elements], language=language)
    pairs = []
    for source_label in [LABEL_POSITIVE, LABEL_NEGATIVE]:
        source_idxs = [i for i, (element, rep) in enumerate(zip(labeled_elements, sent_reps))
                       if element.category_to_label[category_name].label == source_label
                       and rep[0] != 0]
        target_idxs = [i for i, (element, rep) in enumerate(zip(labeled_elements, sent_reps))
                       if element.category_to_label[category_name].label != source_label
                       and rep[0] != 0]
        source_embs = [sent_reps[i] for i in source_idxs]
        target_embs = [sent_reps[i] for i in target_idxs]

        nbrs = NearestNeighbors(n_neighbors=1, algorithm='ball_tree').fit(source_embs)
        distances_to_closest_source, indices_of_closest_source = nbrs.kneighbors(target_embs)

        distances_and_pairs = \
            [(distance, (labeled_elements[source_idxs[neighbor_idx]], labeled_elements[target_idxs[i]]))
             for i, (distance, neighbor_idx) in enumerate(zip(np.squeeze(distances_to_closest_source),
                                                              np.squeeze(indices_of_closest_source)))]
        sorted_element_pairs = [x[1] for x in sorted(distances_and_pairs, key=lambda x: x[0])]
        pairs.append(sorted_element_pairs)
    unified_pairs_list = [tup for subset in itertools.zip_longest(*pairs) for tup in subset if tup is not None]
    unified_pairs_list = filter_nearest_neighbor_pairs(unified_pairs_list, language=language, tuple_index_to_filter=0)
    # align pairs by label
    unified_pairs_list = [
        sorted(pair, key=lambda te: te.category_to_label[category_name].label, reverse=True)
        for pair in unified_pairs_list]
    return unified_pairs_list


def get_word_overlap(text_a, text_b):
    a_tokens = set(text_a.lower().split())
    b_tokens = set(text_b.lower().split())
    intersection = a_tokens.intersection(b_tokens)
    overlap = len(intersection) / min(len(a_tokens), len(b_tokens))
    return overlap


def filter_nearest_neighbor_pairs(pairs_list: List[Tuple], language, tuple_index_to_filter=0):
    # remove duplicate pairs
    unique_pairs = set()
    filtered_pairs_list = [tup for tup in pairs_list if frozenset({tup[0].uri, tup[1].uri}) not in unique_pairs
                           and not unique_pairs.add(frozenset({tup[0].uri, tup[1].uri}))]

    # remove pairs with low token overlap
    filtered_pairs_list = [(element_a, element_b) for element_a, element_b in filtered_pairs_list
                           if get_word_overlap(*remove_stop_words_and_punctuation([element_a.text, element_b.text],
                                                                                  language=language)) > MIN_OVERLAP_THRESHOLD]

    # remove elements that appear too many times (currently this is a maximum of 3 appearances: each element can appear
    # once as a source element, and 0-2 times as a nearest neighbor to another source element)
    uri_counts = defaultdict(lambda: 0)
    filtered_pairs_list = [tup for tup in filtered_pairs_list if uri_counts[tup[tuple_index_to_filter].uri] <= 1
                           and not uri_counts.update({tup[tuple_index_to_filter].uri:
                                                          uri_counts[tup[tuple_index_to_filter].uri] + 1})]
    return filtered_pairs_list
