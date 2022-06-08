import logging
from typing import Sequence

from label_sleuth.analysis_utils.analyze_tokens import ngrams_by_info_gain
from label_sleuth.models.core.languages import Languages
from label_sleuth.orchestrator.core.state_api.orchestrator_state_api import Iteration


def extract_iteration_information_list(iterations: Sequence[Iteration]):
    res_list = \
        [{'model_id': iteration_index,  # TODO change key
          'model_status': iteration.model.model_status.name,
          'creation_epoch': iteration.model.creation_date.timestamp(),
          'model_type': iteration.model.model_type.name,
          # The frontend expects a dict of string to int, and train counts contains a mix of boolean and string keys.
          'model_metadata': {**iteration.model.model_metadata, **iteration.iteration_statistics,
                             "train_counts": {str(k).lower(): v
                                              for k, v in iteration.model.model_metadata["train_counts"].items()}},
          'active_learning_status': iteration.status.name}
         for iteration_index, iteration in enumerate(iterations)]

    res_sorted = [{**model_dict, 'iteration': i} for i, model_dict in enumerate(
        sorted(res_list, key=lambda item: item['creation_epoch']))]

    return res_sorted


def extract_enriched_ngrams_and_weights_list(elements, boolean_labels):
    try:
        texts = [element.text for element in elements]
        enriched_ngrams_and_weights = ngrams_by_info_gain(texts, boolean_labels, ngram_max_length=2,
                                                          language=Languages.ENGLISH)
    except Exception as e:
        logging.warning(f"Failed to calculate enriched tokens from {len(elements)} elements: error {e}")
        enriched_ngrams_and_weights = {}

    ngrams_and_weights_list = [{'text': ngram, 'weight': weight} for ngram, weight in enriched_ngrams_and_weights]
    return ngrams_and_weights_list[:30]
