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
import string
import sys
from typing import Dict, Iterable, Sequence

import pandas as pd

from label_sleuth.data_access.core.data_structs import DisplayFields, LABEL_POSITIVE, Label, TextElement
from label_sleuth.data_access.data_access_api import get_document_uri


def get_element_group_by_texts(texts: Sequence[str], workspace_id, dataset_name, data_access, doc_uri=None) \
        -> Iterable[TextElement]:
    """
    The user may import a large number of labeled instances, and these will not necessarily be given with a text
    element uri. Thus, the goal here is to efficiently query for a group of text elements using only the texts, and
    optionally a *doc_uri* that the texts belong to.
    The order of the returned elements DOES NOT match the order of the texts given as input.
    """
    # TODO When we pass a doc_id, it is important not to remove duplicates. But is it really necessary to remove duplicates when we don't?
    remove_duplicates = False if doc_uri is not None else True
    regex = '|'.join(f'^{re.escape(t)}$' for t in texts)
    elements = data_access.get_text_elements(workspace_id=workspace_id, dataset_name=dataset_name,
                                             sample_size=sys.maxsize, query_regex=regex,
                                             remove_duplicates=remove_duplicates)['results']
    if doc_uri is not None:
        elements = [e for e in elements if get_document_uri(e.uri) == doc_uri]
    return elements


def process_labels_dataframe(workspace_id, dataset_name, data_access, labels_df_to_import: pd.DataFrame) \
        -> Dict[str, Dict[str, Dict[str, Label]]]:
    logging.warning("Currently label metadata and label_type are ignored")
    # replace punctuation with underscores in category names
    punctuation = string.punctuation.replace("'", "") + string.whitespace
    labels_df_to_import[DisplayFields.category_name] = labels_df_to_import[DisplayFields.category_name].apply(str)
    labels_df_to_import[DisplayFields.category_name] = labels_df_to_import[DisplayFields.category_name].apply(
        lambda x: x.translate(x.maketrans(punctuation, '_' * len(punctuation))))
    # convert binary labels in dataframe to boolean
    positive_indicators = {LABEL_POSITIVE, str(LABEL_POSITIVE), str(LABEL_POSITIVE).upper(),
                           str(LABEL_POSITIVE).lower(), 1, "1"}
    labels_df_to_import[DisplayFields.label] = labels_df_to_import[DisplayFields.label].apply(
        lambda x: True if x in positive_indicators else False)

    category_to_uri_to_label = {}
    for category_name, category_df in labels_df_to_import.groupby(DisplayFields.category_name):
        # Here we group the texts by label, and optionally also by doc_id. The goal is to be able to efficiently
        # query for a group of elements by their texts - using *get_element_group_by_texts* - rather than querying
        # and assigning a label for one text at a time.
        if DisplayFields.doc_id not in category_df.columns:
            doc_id_to_label_to_texts = {None:
                                            {label: df_for_label[DisplayFields.text]
                                             for label, df_for_label in category_df.groupby(DisplayFields.label)}}
        else:
            doc_id_to_label_to_texts = {doc_id:
                                            {label: df_for_label[DisplayFields.text]
                                             for label, df_for_label in df_for_doc.groupby(DisplayFields.label)}
                                        for doc_id, df_for_doc in category_df.groupby(DisplayFields.doc_id)}
        uri_to_label = {}
        for doc_id, label_to_texts in doc_id_to_label_to_texts.items():
            doc_uri = f'{dataset_name}-{doc_id}' if doc_id is not None else None  # TODO if we change uri and doc id etc, we should change this field here
            for label, texts in label_to_texts.items():
                elements_to_label = get_element_group_by_texts(texts, workspace_id, dataset_name, data_access,
                                                               doc_uri=doc_uri)
                uri_to_label.update({e.uri: {category_name: Label(label=label)} for e in elements_to_label})
        category_to_uri_to_label[category_name] = uri_to_label
    return category_to_uri_to_label
