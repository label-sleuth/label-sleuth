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
import re
from typing import List, Mapping, Sequence

from flask import current_app

from label_sleuth.analysis_utils.analyze_tokens import ngrams_by_info_gain
from label_sleuth.data_access.core.data_structs import TextElement
from label_sleuth.data_access.data_access_api import get_document_uri
from label_sleuth.models.core.languages import Languages
from label_sleuth.orchestrator.core.state_api.orchestrator_state_api import Iteration, IterationStatus
from label_sleuth.orchestrator.orchestrator_api import TRAIN_COUNTS_STR_KEY


def elements_back_to_front(workspace_id: str, elements: List[TextElement], category_name: str) -> List[Mapping]:
    """
    Converts TextElement objects from the backend into dictionaries in the form expected by the frontend, and adds
    the model prediction for the elements if available.
    :param workspace_id:
    :param elements: a list of TextElements
    :param category_name:
    :return: a list of dictionaries with element information
    """

    element_uri_to_info = \
        {text_element.uri:
             {'id': text_element.uri,
              'docid': get_document_uri(text_element.uri),
              'begin': text_element.span[0][0],
              'end': text_element.span[0][1],
              'text': text_element.text,
              'user_labels': {k: str(v.label).lower()  # TODO current UI is using true and false as strings. change to boolean in the new UI
                              for k, v in text_element.category_to_label.items()},
              'model_predictions': {}
              }
         for text_element in elements}

    if category_name and len(elements) > 0 \
            and len(current_app.orchestrator_api.get_all_iterations_by_status(workspace_id, category_name,
                                                                              IterationStatus.READY)) > 0:
        predicted_labels = [pred.label
                            for pred in current_app.orchestrator_api.infer(workspace_id, category_name, elements)]
        for text_element, prediction in zip(elements, predicted_labels):
            # the frontend expects string labels and not boolean
            element_uri_to_info[text_element.uri]['model_predictions'][category_name] = str(prediction).lower()

    return [element_info for element_info in element_uri_to_info.values()]


def get_element(workspace_id, category_name, element_id):
    """
    Get element by id
    :param workspace_id:
    :param category_name:
    :param element_id:
    """
    dataset_name = current_app.orchestrator_api.get_dataset_name(workspace_id)
    element = current_app.orchestrator_api.get_text_elements_by_uris(workspace_id, dataset_name, [element_id])
    element_transformed = elements_back_to_front(workspace_id, element, category_name)[0]
    return element_transformed


def extract_iteration_information_list(iterations: Sequence[Iteration]):
    res_list = \
        [{'model_id': iteration_index,  # TODO change key
          'model_status': iteration.model.model_status.name,
          'creation_epoch': iteration.model.creation_date.timestamp(),
          'model_type': iteration.model.model_type.name,
          # The frontend expects a dict of string to int, and train counts contains a mix of boolean and string keys.
          'model_metadata': {**iteration.model.train_statistics, **iteration.iteration_statistics,  # TODO change model_metadata key in coordination with frontend
                             TRAIN_COUNTS_STR_KEY: {str(k).lower(): v for k, v
                                                    in iteration.model.train_statistics[TRAIN_COUNTS_STR_KEY].items()}},
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


def get_natural_sort_key(text):
    return [int(x) if x.isdigit() else x for x in re.split(r'(\d+)', text)]
