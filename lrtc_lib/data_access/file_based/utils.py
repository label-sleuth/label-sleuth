import os
import re

import pandas as pd
from lrtc_lib.data_access.core.data_structs import TextElement, URI_SEP
from lrtc_lib.data_access.data_access_api import LabeledStatus


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


def filter_by_labeled_status(df: pd.DataFrame, labels: pd.Series, category_name: str, labeled_status: LabeledStatus):
    """
    :param df:
    :param labels:
    :param category_name:
    :param labeled_status: unlabeled, labeled or all
    :return:
    """
    if labeled_status == LabeledStatus.UNLABELED:
        return df[labels.apply(lambda x: category_name not in x)]

    elif labeled_status == LabeledStatus.LABELED:
        return df[labels.apply(lambda x: category_name in x)]

    return df


def filter_by_query(df: pd.DataFrame, query):
    if query:
        return df[df.text.str.contains(query, flags=re.IGNORECASE, na=False)]
    return df


def filter_by_query_and_label_status(df: pd.DataFrame, labels_series: pd.Series, category_name: str,
                                     labeled_status: LabeledStatus, query: str):
    df = filter_by_labeled_status(df, labels_series, category_name, labeled_status)
    df = filter_by_query(df, query)
    return df
