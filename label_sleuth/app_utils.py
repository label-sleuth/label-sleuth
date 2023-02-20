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
import functools
import logging
import re
from typing import List, Mapping, Sequence

from flask import current_app, request, jsonify

from label_sleuth.analysis_utils.analyze_tokens import ngrams_by_info_gain
from label_sleuth.data_access.core.data_structs import TextElement
from label_sleuth.data_access.data_access_api import get_document_uri
from label_sleuth.models.core.languages import Languages
from label_sleuth.orchestrator.core.state_api.orchestrator_state_api import Iteration, IterationStatus
from label_sleuth.orchestrator.orchestrator_api import TRAIN_COUNTS_STR_KEY


def validate_workspace_id(function):
    @functools.wraps(function)
    def wrapper(workspace_id, *args, **kwargs):
        if not current_app.orchestrator_api.workspace_exists(workspace_id):
            return jsonify({"type": "workspace_id_does_not_exist",
                            "title": f"workspace_id {workspace_id} does not exist"}), 404
        return function(workspace_id, *args, **kwargs)

    return wrapper


def validate_category_id(function):
    @functools.wraps(function)
    def wrapper(workspace_id, *args, **kwargs):
        category_id = request.args.get('category_id')
        if category_id is None:
            return jsonify({"type": "missing_category_id", "title": "category_id was not provided"}), 422

        category_id = int(category_id)
        if category_id not in current_app.orchestrator_api.get_all_categories(workspace_id):
            return jsonify({"type": "category_id_does_not_exist",
                            "title": f"category_id {category_id} does not exist in workspace {workspace_id}"}), 404
        return function(workspace_id, *args, **kwargs)

    return wrapper


def elements_back_to_front(workspace_id: str, elements: List[TextElement], category_id: int) -> List[Mapping]:
    """
    Converts TextElement objects from the backend into dictionaries in the form expected by the frontend, and adds
    the model prediction for the elements if available.
    :param workspace_id:
    :param elements: a list of TextElements
    :param category_id:
    :return: a list of dictionaries with element information
    """

    element_uri_to_info = \
        {text_element.uri:
             {'id': text_element.uri,
              'docid': get_document_uri(text_element.uri),
              'begin': text_element.span[0][0],
              'end': text_element.span[0][1],
              'text': text_element.text,
              'user_labels': {k: str(v.label).lower()
                              # TODO current UI is using true and false as strings. change to boolean in the new UI
                              for k, v in text_element.category_to_label.items()},
              'model_predictions': {}
              }
         for text_element in elements}

    if category_id is not None and len(elements) > 0 \
            and len(current_app.orchestrator_api.get_all_iterations_by_status(workspace_id, category_id,
                                                                              IterationStatus.READY)) > 0:
        predicted_labels = [pred.label
                            for pred in current_app.orchestrator_api.infer(workspace_id, category_id, elements)]
        for text_element, prediction in zip(elements, predicted_labels):
            # the frontend expects string labels and not boolean
            element_uri_to_info[text_element.uri]['model_predictions'][category_id] = str(prediction).lower()

    return [element_info for element_info in element_uri_to_info.values()]


def get_element(workspace_id, category_id, element_id):
    """
    Get element by id
    :param workspace_id:
    :param category_id:
    :param element_id:
    """
    dataset_name = current_app.orchestrator_api.get_dataset_name(workspace_id)
    element = current_app.orchestrator_api.get_text_elements_by_uris(workspace_id, dataset_name, [element_id])
    element_transformed = elements_back_to_front(workspace_id, element, category_id)[0]
    return element_transformed


def _extract_model_info(iteration):
    # TODO reorganize model information
    placeholder = 'Unknown'
    model_info_dict = {'model_status': placeholder, 'creation_epoch': placeholder, 'model_type': placeholder,
                       'model_metadata': placeholder}
    if iteration.model is not None:
        model_info_dict['model_status'] = iteration.model.model_status.name
        model_info_dict['creation_epoch'] = iteration.model.creation_date.timestamp()
        model_info_dict['model_type'] = iteration.model.model_type.name \
            if iteration.model.model_type is not None else placeholder
        # The frontend expects a dict of string to int, and train counts contains a mix of boolean and string keys.
        model_info_dict['model_metadata'] = \
            {**iteration.model.train_statistics,
             TRAIN_COUNTS_STR_KEY: {str(k).lower(): v for k, v
                                    in iteration.model.train_statistics.get(TRAIN_COUNTS_STR_KEY, {}).items()}}
    return model_info_dict


def extract_iteration_information_list(iterations: Sequence[Iteration]):
    return \
        [{'iteration': iteration_index,
          **iteration.iteration_statistics,
          'iteration_status': iteration.status.name,
          **_extract_model_info(iteration)}
         for iteration_index, iteration in enumerate(iterations)]


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
