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

import pandas as pd
from label_sleuth.data_access.core.data_structs import TextElement, URI_SEP
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
    element_data_columns = TextElement.get_field_names() - {'category_to_label'}
    element_dicts = df[element_data_columns].to_dict('records')
    text_elements = [TextElement(**d, category_to_label=labels_dict.get(d['uri'], {}).copy())
                     for d in element_dicts]
    return text_elements


def filter_by_labeled_status(df: pd.DataFrame, labels: pd.Series, category_id: int, labeled_status: LabeledStatus):
    """
    :param df:
    :param labels:
    :param category_id:
    :param labeled_status: unlabeled, labeled or all
    :return:
    """
    if labeled_status == LabeledStatus.UNLABELED:
        return df[labels.apply(lambda x: category_id not in x)]
    elif labeled_status == LabeledStatus.LABELED:
        return df[labels.apply(lambda x: category_id in x)]
    return df


def filter_by_query_and_document_uri(df: pd.DataFrame, query, is_regex: bool = False, document_id=None):
    if document_id is not None:
        df = df[df.uri.str.startswith(f"{document_id}-")]
    if query:
        df = df[df.text.str.contains(query, case=False, na=False, regex=is_regex)]
    return df


def filter_by_query_and_label_status(df: pd.DataFrame, labels_series: pd.Series, category_id: int,
                                     labeled_status: LabeledStatus, query: str, is_regex: bool = False):
    df = filter_by_labeled_status(df, labels_series, category_id, labeled_status)
    return filter_by_query_and_document_uri(df, query, is_regex)
