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

import re
from typing import Set

import pandas as pd
from label_sleuth.data_access.core.data_structs import TextElement, URI_SEP, LabelType
from label_sleuth.data_access.data_access_api import LabeledStatus


def get_dataset_name_from_uri(uri):
    uri_split = uri.split(URI_SEP)
    return uri_split[0]


def get_sort_key_by_document_name(uri):
    def natural_sort(text):
        return [int(x) if x.isdigit() else x for x in re.split(r'(\d+)', text)]

    doc_name = uri.split(URI_SEP)[1]
    return natural_sort(doc_name)


def uri_to_filename(uri):
    filename = uri.rstrip(URI_SEP)
    return filename


def filename_to_uri(filename):
    uri = filename
    return uri


def build_text_elements_from_dataframe_and_labels(df, labels_dict):
    # text element fields are extracted from the dataframe, with the exception of the labels, which are stored elsewhere
    element_data_columns = list(TextElement.get_field_names() - {'category_to_label'})
    element_dicts = map(lambda row: dict(zip(element_data_columns, row)), df[element_data_columns].values)
    text_elements = [TextElement(**d, category_to_label=labels_dict.get(d['uri'], {}).copy())
                     for d in element_dicts]

    return text_elements


def filter_by_labeled_status(df: pd.DataFrame, labels_series: pd.Series, category_id: int, labeled_status: LabeledStatus,
                             label_types: Set[LabelType] = None):
    """
    :param df:
    :param labels_series: series of the label dictionary corresponding to each element in the dataframe
    :param category_id:
    :param labeled_status: unlabeled, labeled or all
    :param label_types: set of applicable label types if filtering for labeled elements (LabelStatus.LABELED)
    :return:
    """
    if labeled_status in [LabeledStatus.UNLABELED, LabeledStatus.ALL] and label_types is not None:
        raise Exception(f"Label type is inapplicable when fetching {labeled_status} elements")

    if labeled_status == LabeledStatus.LABELED and label_types is None:
        raise Exception(f"label_types must be provided when filtering labeled elements")

    if labeled_status == LabeledStatus.UNLABELED:
        return df[labels_series.apply(lambda x: category_id not in x)]
    elif labeled_status == LabeledStatus.LABELED:
        return df[labels_series.apply(lambda x: category_id in x and x[category_id].label_type in label_types)]

    return df


def filter_by_query_and_document_uri(df: pd.DataFrame, query, is_regex: bool = False, document_id=None):
    if document_id is not None:
        df = df[df.uri.str.startswith(f"{document_id}-")]
    if query:
        # case=is_regex: we want the query to be case sensitive if we are matching using a regex and case insensitive otherwise
        df = df[df.text.str.contains(query, case=is_regex, na=False, regex=is_regex)]
    return df


def filter_by_query_and_label_status(df: pd.DataFrame, labels_series: pd.Series, category_id: int,
                                     labeled_status: LabeledStatus, query: str, is_regex: bool = False,
                                     label_types: Set[LabelType] = None):
    """
    :param df:
    :param labels_series: series of the label dictionary corresponding to each element in the dataframe
    :param category_id:
    :param labeled_status: unlabeled, labeled or all
    :param query: query to use for filtering text elements
    :param is_regex: whether to process the query as regular expression
    :param label_types: set of applicable label types if filtering for labeled elements (LabelStatus.LABELED)
    :return:
    """
    df = filter_by_labeled_status(df, labels_series, category_id, labeled_status, label_types=label_types)
    return filter_by_query_and_document_uri(df, query, is_regex)
