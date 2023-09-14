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
import ast
import logging
import re
import sys
from typing import Dict, Iterable, Sequence, List, Union, Tuple
import pandas as pd
from label_sleuth.data_access.core.data_structs import DisplayFields, LABEL_POSITIVE, Label, TextElement, LabelType, \
    URI_SEP, MulticlassLabel


def get_element_group_by_texts(texts: Sequence[str], workspace_id, dataset_name, data_access, remove_duplicates) \
        -> Iterable[TextElement]:
    """
    The user may import a large number of labeled instances, and these will not necessarily be given with a text
    element uri. Thus, the goal here is to efficiently query for a group of text elements using only the texts, and
    optionally a *doc_uri* that the texts belong to.
    The order of the returned elements DOES NOT match the order of the texts given as input.
    """
    regex = '|'.join(f'^{re.escape(t)}$' for t in texts)
    elements = data_access.get_text_elements(workspace_id=workspace_id, dataset_name=dataset_name,
                                             sample_size=sys.maxsize, query=regex, is_regex=True,
                                             document_uri=None, remove_duplicates=remove_duplicates)
    return elements['results']


def merge_and_rename_dfs(a: pd.DataFrame, b: pd.DataFrame, on: Union[str, List[str]]):
    df = pd.merge(left=a, right=b, on=on, suffixes=('_x', None))
    df = df[df.columns.intersection(DisplayFields.__dict__)]
    return df


def process_labels_dataframe(workspace_id, dataset_name, data_access, labels_df_to_import: pd.DataFrame,
                             is_binary = True, apply_labels_to_duplicate_texts=False) -> \
        Tuple[Dict[str, Dict[str, Dict[str, Label]]], Dict[str, List[str]]]:
    logging.warning("Currently label metadata is ignored")

    if DisplayFields.doc_id in labels_df_to_import.columns:
        labels_df_to_import[DisplayFields.doc_id] = labels_df_to_import[DisplayFields.doc_id].apply(
            lambda x: str(x).replace(URI_SEP, '_'))
    if is_binary:
        labels_df_to_import[DisplayFields.category_name] = labels_df_to_import[DisplayFields.category_name].apply(str)
        # convert binary labels in dataframe to boolean
        positive_indicators = {LABEL_POSITIVE, str(LABEL_POSITIVE), str(LABEL_POSITIVE).upper(),
                               str(LABEL_POSITIVE).lower(), 1, "1"}

        labels_df_to_import[DisplayFields.label] = labels_df_to_import[DisplayFields.label].apply(
            lambda x: True if x in positive_indicators else False)

    if DisplayFields.label_type not in labels_df_to_import.columns:
        labels_df_to_import[DisplayFields.label_type] = LabelType.Standard.name

    # calling get_element_group_by_texts is the most expensive call on this function and,
    # removing duplicates from the texts iterable significantly reduces its runtime
    texts = labels_df_to_import[DisplayFields.text].unique()

    elements = get_element_group_by_texts(texts, workspace_id, dataset_name, data_access, remove_duplicates=False)   

    # convert Element list into a DataFrame in order to perform the join operation
    query_elements_df = pd.DataFrame(
            [[e.text, e.uri.split('-')[1], e.uri] for e in elements],
            columns=[DisplayFields.text, DisplayFields.doc_id, DisplayFields.uri]
        )

    def has_contradicting_labels(df: pd.DataFrame):
        return df[DisplayFields.label].unique().shape[0] > 1
  
    # check if the user uploaded contradicting labels
    group_by_cols = [DisplayFields.text]
    if is_binary:
        group_by_cols.append(DisplayFields.category_name)

    if not apply_labels_to_duplicate_texts:
        group_by_cols.append(DisplayFields.doc_id)
    contradicting_labels_df = labels_df_to_import.groupby(group_by_cols).filter(has_contradicting_labels)
    contradicting_labels_texts = contradicting_labels_df.reset_index()[DisplayFields.text].unique().tolist()
    contradicting_labels_info = {
        'elements': contradicting_labels_texts
    }

    if apply_labels_to_duplicate_texts:
        # duplicates are dropped because if not too many duplicates will be present on the joined DataFrame
        labels_df_to_import.drop_duplicates(subset=group_by_cols, inplace=True)
        df = merge_and_rename_dfs(
                labels_df_to_import, 
                query_elements_df, 
                DisplayFields.text
            )
    else:
        df = merge_and_rename_dfs(
                labels_df_to_import, 
                query_elements_df, 
                [DisplayFields.doc_id, DisplayFields.text]
            )

    if is_binary:
        category_to_uri_to_label = {}
        for category_name, category_df in df.groupby(DisplayFields.category_name):
            uri_to_label = {row[DisplayFields.uri]:
                                {category_name: Label(label=bool(row[DisplayFields.label]),
                                                      label_type=LabelType[row[DisplayFields.label_type]],
                                                      metadata={} if DisplayFields.label_metadata not in row
                                                      else ast.literal_eval(row[DisplayFields.label_metadata]))}
                            for row in category_df.to_dict("records")}
            category_to_uri_to_label[category_name] = uri_to_label

        return category_to_uri_to_label, contradicting_labels_info
    else:
        uri_to_label = {row[DisplayFields.uri]: MulticlassLabel(label=row[DisplayFields.label],
                                                                label_type=LabelType[row[DisplayFields.label_type]],
                                                                metadata={} if DisplayFields.label_metadata not in row
                                                                else ast.literal_eval(
                                                                    row[DisplayFields.label_metadata]))
                        for row in df.to_dict("records")}

        return uri_to_label, contradicting_labels_info


# def process_labels_dataframe_multiclass(workspace_id, dataset_name, data_access, labels_df_to_import: pd.DataFrame,
#                                     apply_labels_to_duplicate_texts=False) -> Tuple[
#     Dict[str, MulticlassLabel],
#     Dict[str, List[str]]]:
#     logging.warning("Currently label metadata is ignored")
#
#     if DisplayFields.doc_id in labels_df_to_import.columns:
#         labels_df_to_import[DisplayFields.doc_id] = labels_df_to_import[DisplayFields.doc_id].apply(
#             lambda x: str(x).replace(URI_SEP, '_'))
#
#     # add label type if not exists
#     if DisplayFields.label_type not in labels_df_to_import.columns:
#         labels_df_to_import[DisplayFields.label_type] = LabelType.Standard.name
#
#     # calling get_element_group_by_texts is the most expensive call on this function and,
#     # removing duplicates from the texts iterable significantly reduces its runtime
#     texts = labels_df_to_import[DisplayFields.text].unique()
#
#     elements = get_element_group_by_texts(texts, workspace_id, dataset_name, data_access, remove_duplicates=False)
#
#     # convert Element list into a DataFrame in order to perform the join operation
#     query_elements_df = pd.DataFrame(
#         [[e.text, e.uri.split('-')[1], e.uri] for e in elements],
#         columns=[DisplayFields.text, DisplayFields.doc_id, DisplayFields.uri]
#     )
#
#     def has_contradicting_labels(df: pd.DataFrame):
#         return df[DisplayFields.label].unique().shape[0] > 1
#
#     # check if the user uploaded contradicting labels
#     group_by_cols = [DisplayFields.text]
#     if not apply_labels_to_duplicate_texts:
#         group_by_cols.append(DisplayFields.doc_id)
#     contradicting_labels_df = labels_df_to_import.groupby(group_by_cols).filter(has_contradicting_labels)
#     contradicting_labels_texts = contradicting_labels_df.reset_index()[DisplayFields.text].unique().tolist()
#     contradicting_labels_info = {
#         'elements': contradicting_labels_texts
#     }
#
#     if apply_labels_to_duplicate_texts:
#         # duplicates are dropped because if not too many duplicates will be present on the joined DataFrame
#         labels_df_to_import.drop_duplicates(subset=[DisplayFields.text], inplace=True)
#         df = merge_and_rename_dfs(
#             labels_df_to_import,
#             query_elements_df,
#             DisplayFields.text
#         )
#     else:
#         df = merge_and_rename_dfs(
#             labels_df_to_import,
#             query_elements_df,
#             [DisplayFields.doc_id, DisplayFields.text]
#         )
#
#
#     uri_to_label = {row[DisplayFields.uri]: MulticlassLabel(label=row[DisplayFields.label],
#                                               label_type=LabelType[row[DisplayFields.label_type]],
#                                               metadata={} if DisplayFields.label_metadata not in row
#                                               else ast.literal_eval(row[DisplayFields.label_metadata]))
#                     for row in df.to_dict("records")}
#
#
#     return uri_to_label, contradicting_labels_info