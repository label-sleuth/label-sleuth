import logging

from lrtc_lib.analysis_utils.analyze_tokens import ngrams_by_info_gain
from lrtc_lib.models.core.languages import Languages


def information_gain(elements, target_labels, language=Languages.ENGLISH):
    if len(elements) == 0:
        return
    try:
        texts = [element.text for element in elements]
        sorted_res = ngrams_by_info_gain(texts, target_labels, ngram_max_length=2, language=language)
    except Exception as e:
        logging.warning(f"Failed to calculate info gain of {len(elements)} elements: error {e}")
        sorted_res = {}
    formatted_res = [{'text': tup[0], 'weight': tup[1]} for tup in sorted_res]
    return formatted_res[:30]
