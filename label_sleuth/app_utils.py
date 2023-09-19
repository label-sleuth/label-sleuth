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
import json
import logging
import re
from typing import List, Mapping, Sequence, Union
import os
from flask import current_app, request, jsonify

from label_sleuth.analysis_utils.analyze_tokens import ngrams_by_info_gain
from label_sleuth.data_access.core.data_structs import TextElement, LabeledTextElement, MulticlassLabeledTextElement, \
    WorkspaceModelType
from label_sleuth.data_access.data_access_api import get_document_uri
from label_sleuth.models.core.languages import Languages
from label_sleuth.orchestrator.core.state_api.orchestrator_state_api import Iteration, IterationStatus
from label_sleuth.orchestrator.orchestrator_api import TRAIN_COUNTS_STR_KEY
from label_sleuth.utils import make_error


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
        is_multiclass = request.args.get('mode') == WorkspaceModelType.MultiClass.name
        category_id = request.args.get('category_id')

        if not is_multiclass:
            if category_id is None:
                return jsonify({"type": "missing_category_id", "title": "category_id was not provided"}), 422

            category_id = int(category_id)
            if category_id not in current_app.orchestrator_api.get_all_categories(workspace_id):
                return jsonify({"type": "category_id_does_not_exist",
                                "title": f"category_id {category_id} does not exist in workspace {workspace_id}"}), 404
        else:
            if category_id is not None:
                return jsonify({"type": "invalid_category_id",
                                "title": f"category_id {category_id} is invalid for a multiclass workspace"}), 404

        return function(workspace_id, *args, **kwargs)

    return wrapper


def _text_element_to_user_labels(text_element: Union[TextElement, LabeledTextElement, MulticlassLabeledTextElement]):
    if type(text_element) == TextElement:
        return None
    elif type(text_element) == LabeledTextElement:
        return None if len(text_element.category_to_label) == 0 else {k: str(v.label).lower()
                                                                  for k, v in text_element.category_to_label.items()}
    elif type(text_element) == MulticlassLabeledTextElement:
        return None if text_element.label is None else text_element.label.label


def elements_back_to_front(workspace_id: str,
                           elements: List[Union[TextElement, LabeledTextElement, MulticlassLabeledTextElement]],
                           category_id: Union[int, None],
                           need_snippet: bool = True,
                           query_string: str = None, is_regex: bool = False) -> List[Mapping]:
    """
    Converts TextElement objects from the backend into dictionaries in the form expected by the frontend, and adds
    the model prediction for the elements if available.
    :param workspace_id:
    :param elements: a list of TextElements
    :param category_id:
    :param need_snippet: whether to create a text snippet
    :param query_string: query to include in snippet
    :return: a list of dictionaries with element information
    """

    element_uri_to_info = \
        {text_element.uri:
             {'id': text_element.uri,
              'docid': get_document_uri(text_element.uri),
              'begin': text_element.span[0][0],
              'end': text_element.span[0][1],
              'text': text_element.text,
              'user_labels': _text_element_to_user_labels(text_element),
              'model_predictions': None
              }
         for text_element in elements}
    if need_snippet:
        for text_element in elements:
            snippet = get_text_snippet(text_element.text, query_string, is_regex)
            if snippet != element_uri_to_info[text_element.uri]['text']:
                element_uri_to_info[text_element.uri]['snippet'] = snippet

    if len(elements) > 0 \
            and len(current_app.orchestrator_api.get_all_iterations_by_status(workspace_id, category_id,
                                                                              IterationStatus.READY)) > 0:
        is_multiclass = category_id is None
        predicted_labels = [pred.label
                            for pred in current_app.orchestrator_api.infer(workspace_id, category_id, elements)]
        for text_element, prediction in zip(elements, predicted_labels):
            if is_multiclass:
                element_uri_to_info[text_element.uri]['model_predictions'] = prediction
            else:
                # the frontend expects string labels and not boolean
                element_uri_to_info[text_element.uri]['model_predictions'] = {category_id: str(prediction).lower()}

    return [element_info for element_info in element_uri_to_info.values()]


def get_element(workspace_id, category_id, element_id):
    """
    Get element by id
    :param workspace_id:
    :param category_id:
    :param element_id:
    """
    element = current_app.orchestrator_api.get_text_elements_by_uris(workspace_id, [element_id])
    element_transformed = elements_back_to_front(workspace_id, element, category_id)[0]
    return element_transformed


def _extract_model_info(iteration):
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


def get_text_snippet(text, query_string, is_regex: bool):
    """
    Get snippet from full text.
    1. If length of text in tokens is less than snippet maximum length, the full text is returned.
    2. If there is no query, or query is not matched, the snippet is built from the start and the end of the text.
    3. if query is matched to the text, the snippet is built from up to 3 excerpts containing the query.
    Query must be contained by an exact match to the text (case in-sensitive).
    :param text:
    :param query_string:
    :return: a string containing snippet
    """

    text_tokens = text.split(" ")
    max_token_length = current_app.config['CONFIGURATION'].snippet_max_token_length
    if len(text_tokens) <= max_token_length:
        return text
    starting_text = " ".join(text_tokens[:int(max_token_length / 2)])
    end_text = " ".join(text_tokens[-int(max_token_length / 2):])
    if not query_string:
        return starting_text + " ... " + end_text
    
    query_string = re.escape(query_string)

    matches = [m for m in re.finditer(
        r"[\b]?[0-9a-zA-Z_`'.-]*" + query_string + r"[0-9a-zA-Z_`'.-]*[\b]?",
        text, 
        flags=re.IGNORECASE if is_regex is False else 0)][:3]

    if len(matches) == 0:
        return starting_text + " ... " + end_text
    
    snippet = ""
    num_tokens_before_after_match = max_token_length - len(matches) * len(query_string.split(" "))
    num_tokens_before_after_match = int(num_tokens_before_after_match/(2*len(matches)))
    for i, m in enumerate(matches):
        start_ind = m.regs[0][0]
        end_ind = m.regs[0][1]
        match = text[start_ind:end_ind]
        text_before_match = text[:start_ind].split()
        text_after_match = text[end_ind:].split()
        if i == 0 and start_ind - len(" ".join(text_before_match[-num_tokens_before_after_match:])) > 1:
            snippet += " ... "
        snippet += " ".join(text_before_match[-num_tokens_before_after_match:])
        snippet += " " + match + " "
        snippet += " ".join(text_after_match[:num_tokens_before_after_match])
        if end_ind + len(" ".join(text_after_match[:num_tokens_before_after_match])) < len(text):
            snippet += " ... "

    return snippet


def get_natural_sort_key(text):
    return [int(x) if x.isdigit() else x for x in re.split(r'(\d+)', text)]


def get_default_customizable_UI_text():
    """
    Returns a dict with the default values of the UI customizable elements
    """
    with open(os.path.join(os.path.dirname(__file__), "ui_defaults.json"), "rb") as f:
        return json.load(f)


def get_customizable_UI_text(path: str = None):
    """
    Returns a dict with the values of the UI customizable components, such as texts, urls and app logo.
    If path is None, the defaults are returned. If path is not None, the values in the file are
    returned. If some values are not present in the provided files, the default values are used.
    """
    default_customizable_UI_text = get_default_customizable_UI_text()
    if path is not None:
        try:
            with open(path, "rb") as f:
                customizable_UI_text = json.load(f)
        except FileNotFoundError as e:
            logging.error(f"The custom UI file was not found at {path}")
            return make_error({
                "type": "ui_customizable_elements_file_not_found",
                "title": "The json file with the UI customizable elements was not found.", 
            }, 404)
        wrong_keys = [k for k in customizable_UI_text.keys() if k not in default_customizable_UI_text.keys()]
        if len(wrong_keys) > 0:
            logging.error(f"wrong keys in custom ui file {path}. keys {wrong_keys}")
            return make_error({
                "type": "wrong_customizable_keys",
                "title": f"The following keys in the provided customizable UI elements are not supported: "
                         f"{', '.join(wrong_keys)}."
            }, 404)
        merged = {dk: dv if dk not in customizable_UI_text else customizable_UI_text[dk]
                  for dk, dv in default_customizable_UI_text.items()}
        return merged
    else:
        return default_customizable_UI_text
    
