# (c) Copyright IBM Corporation 2020.

# LICENSE: Apache License 2.0 (Apache-2.0)
# http://www.apache.org/licenses/LICENSE-2.0

import dataclasses
import os
import logging
import re

import ujson as json
import ast
import pandas as pd
import threading
from collections import defaultdict
from typing import Sequence, Iterable, Mapping
from enum import Enum
from pathlib import Path

import lrtc_lib.data_access.core.utils as utils
from lrtc_lib.data_access.core.data_structs import Document, TextElement, Label

'''
Under the DataAccessInMemory implementation of DataAccessApi, information about labels and TextElements are stored both
in the file system and in memory, in the variables "ds_in_memory" and "labels_in_memory" below.
Note that while label information changes over time (as labels are added, altered etc.), the TextElement information 
inside "ds_in_memory" will generally not change after a dataset is loaded.

===ds_in_memory===
maps dataset_name -> pandas DataFrame containing all the dataset sentences

===labels_in_memory===
maps workspace_id -> dataset name -> URIs -> categories -> labels and info

===clusters_in_memory===
maps dataset to (clusters, uri_to_rep) where clusters is a dict of rep uri to list of uris
and uri_to_rep is a dict of uri to a representative uri of a cluster
'''
ds_in_memory = defaultdict(pd.DataFrame)
labels_in_memory = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: defaultdict(dict))))
clusters_in_memory = defaultdict(tuple)
dataset_in_memory_lock = threading.RLock()

random_seeds = {}


class LabeledStatus(Enum):
    UNLABELED = 0
    LABELED = 1
    ALL = 2


def get_ds_in_memory(dataset_name):
    global ds_in_memory
    with dataset_in_memory_lock:
        if dataset_name not in ds_in_memory:
            dataset_file_path = utils.get_dataset_dump_filename(dataset_name)
            if os.path.isfile(dataset_file_path):
                logging.debug(f"reading dataset {dataset_name} csv file")
                df = pd.read_csv(dataset_file_path)
                logging.debug(f"csv file for {dataset_name} read successfully")
                # convert value of TextElement fields to their proper formats
                logging.debug("remove nulls")
                df = df.where(pd.notnull(df), None)
                logging.debug("done remove nulls")
                logging.debug("converting fields")
                df['category_to_label'] = None
                for field in ['span', 'metadata']:
                    df[field] = [ast.literal_eval(x) if x is not None else {} for x in df[field].values]
                logging.debug("done converting fields")
            else:
                raise Exception(f'Cannot find the dataset "{dataset_name}" dump file {dataset_file_path}.')
            ds_in_memory[dataset_name] = df
            load_duplicate_clusters(dataset_name)  # construct clusters
        res = ds_in_memory[dataset_name]
    return res


def add_cluster_info(df):
    clean_to_rep = dict()
    rep_uris = ['self' if x.text not in clean_to_rep and not clean_to_rep.update({x.text: x.uri})
                else clean_to_rep[x.text] for x in df.itertuples()]
    df['rep_uri'] = rep_uris
    return df


def load_duplicate_clusters(dataset_name):
    if dataset_name not in clusters_in_memory:
        clusters = {}
        all_text_elements_df = get_ds_in_memory(dataset_name).copy()
        uri_to_rep = {x: y for x, y in zip(all_text_elements_df["uri"], all_text_elements_df["rep_uri"])}
        if len(all_text_elements_df["rep_uri"].unique()) > 1:
            logging.info(f"Grouping duplicate items")
            clusters = {key: list(group["uri"]) for key, group in all_text_elements_df.groupby(by="rep_uri")}
            logging.info(f"Grouped {len(clusters)} duplicate items")
        clusters_in_memory[dataset_name] = (clusters, uri_to_rep)
    return clusters_in_memory[dataset_name]


def get_labels(workspace_id, dataset_name):
    global labels_in_memory
    if workspace_id not in labels_in_memory or dataset_name not in labels_in_memory[workspace_id]:
        file_path = utils.get_workspace_labels_dump_filename(workspace_id, dataset_name)
        if os.path.isfile(file_path):
            # Read dict from disk
            with open(file_path) as f:
                labels_encoded = f.read()
            simplified_dict = json.loads(labels_encoded)
            labels_dict = defaultdict(lambda: defaultdict(dict))
            labels_dict.update({k: {category: Label(**label_dict) for category, label_dict in v.items()}
                                for k, v in simplified_dict.items()})
            labels_in_memory[workspace_id][dataset_name] = labels_dict
        else:
            # Save empty dict to disk
            os.makedirs(Path(file_path).parent, exist_ok=True)
            empty_dict_encoded = json.dumps(labels_in_memory[workspace_id][dataset_name])
            with open(file_path, 'w') as f:
                f.write(empty_dict_encoded)
    return labels_in_memory[workspace_id][dataset_name]


def add_sentences_to_dataset_in_memory(dataset_name, sentences: Iterable[TextElement]):
    global ds_in_memory
    if os.path.exists(utils.get_dataset_dump_filename(dataset_name)):
        ds_in_memory[dataset_name] = get_ds_in_memory(dataset_name)
    dicts = [dataclasses.asdict(s) for s in sentences]
    new_sentences_df = pd.DataFrame(dicts)
    new_sentences_df = add_cluster_info(new_sentences_df)
    if dataset_name in ds_in_memory:
        ds_in_memory[dataset_name] = ds_in_memory[dataset_name].append(new_sentences_df, sort=False)
    else:
        ds_in_memory[dataset_name] = new_sentences_df
    ds_in_memory[dataset_name].to_csv(utils.get_dataset_dump_filename(dataset_name), index=False)


def add_labels_info_for_doc(workspace_id, dataset_name, doc: Document):
    labels_info_for_workspace = get_labels(workspace_id, dataset_name)
    for elem in doc.text_elements:
        if elem.uri in labels_info_for_workspace:
            elem.category_to_label = labels_info_for_workspace[elem.uri].copy()
    return doc


def add_labels_info_for_text_elements(workspace_id, dataset_name, text_elements: Sequence[TextElement]):
    labels_info_for_workspace = get_labels(workspace_id, dataset_name)
    for elem in text_elements:
        if elem.uri in labels_info_for_workspace:
            elem.category_to_label = labels_info_for_workspace[elem.uri].copy()
    return text_elements


def filter_by_labeled_status(df: pd.DataFrame, category_name: str, labeled_status: LabeledStatus):
    """
    :param df:
    :param category_name:
    :param labeled_status: unlabeled, labeled or all
    :return:
    """
    if labeled_status == LabeledStatus.UNLABELED:
        return df[df['category_to_label'].apply(lambda x: category_name not in x)]

    elif labeled_status == LabeledStatus.LABELED:
        return df[df['category_to_label'].apply(lambda x: category_name in x)]

    return df


def filter_by_query(df: pd.DataFrame, query):
    if query:
        return df[df.text.str.contains(query, flags=re.IGNORECASE, na=False)]
    return df


def filter_by_query_and_label_status(df: pd.DataFrame, category_name: str, labeled_status: LabeledStatus, query: str):
    df = filter_by_labeled_status(df, category_name, labeled_status)
    df = filter_by_query(df, query)
    return df


def get_text_elements(dataset_name: str, uris: Iterable) -> Sequence[TextElement]:
    corpus_df = get_ds_in_memory(dataset_name)
    uris = list(uris)
    corpus_df = corpus_df.loc[corpus_df['uri'].isin(uris)]
    text_elements_by_uri = {te.uri: te for te in get_text_elements_from_df_without_labels(corpus_df)}
    text_elements = [text_elements_by_uri.get(uri) for uri in uris]
    return text_elements


def get_text_elements_from_df_without_labels(df):
    df["category_to_label"]=df["category_to_label"].apply(lambda x:{}) # in case there are label info for some unknown reason
    return [TextElement(*t) for t in
                               df[TextElement.get_field_names()].itertuples(index=False, name=None)]


def sample_text_elements(workspace_id: str, dataset_name: str, sample_size: int,
                         filter_func, sample_start_idx=0, remove_duplicates=False,
                         random_state: int = 0) -> Mapping:
    """

    :param sample_size: if None, return all elements without sampling
    :param workspace_id: if None no labels info would be used or output
    :param dataset_name:
    :param sample_size: number of elements to return
    :param sample_start_idx: get elements starting from this index (for paging)
    :param filter_func:
    :param remove_duplicates:
    :param random_state: provide an int seed to define a random state. Default is zero.
    """
    results_dict = {}
    corpus_df = get_ds_in_memory(dataset_name).copy()
    if workspace_id:
        random_state = sum([ord(c) for c in workspace_id]) + random_state
        labels_dict = get_labels(workspace_id, dataset_name).copy()
        corpus_df['category_to_label'] = corpus_df['uri'].apply(lambda u: labels_dict[u] if u in labels_dict else {})
    else:
        corpus_df['category_to_label'] = corpus_df['category_to_label'].apply(lambda x: {})
    corpus_df = filter_func(corpus_df)
    results_dict['hit_count'] = len(corpus_df)
    if remove_duplicates:
        unique_texts = set()
        corpus_df = corpus_df.loc[corpus_df['text'].apply(lambda x: x not in unique_texts and not unique_texts.add(x))]
        results_dict['hit_count_unique'] = len(corpus_df)

    if sample_size is not None:
        if len(corpus_df) > (sample_size+sample_start_idx):
            corpus_df = corpus_df.sample(n=sample_size+sample_start_idx, random_state=random_state
                                         )[sample_start_idx:sample_start_idx+sample_size]
        else:
            corpus_df = corpus_df[sample_start_idx:sample_start_idx+sample_size]

    results_dict['results'] = [TextElement(*t) for t in
                               corpus_df[TextElement.get_field_names()].itertuples(index=False, name=None)]
    return results_dict


def clear_labels_in_memory():
    global labels_in_memory
    labels_in_memory = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: defaultdict(dict))))


def save_labels_data(dataset_name, workspace_id):
    file_path = utils.get_workspace_labels_dump_filename(workspace_id, dataset_name)
    os.makedirs(Path(file_path).parent, exist_ok=True)
    labels = labels_in_memory[workspace_id][dataset_name]
    simplified_labels = {k: {str(category): label.to_dict() for category, label in v.items()}
                         for k, v in labels.items()}
    labels_in_memory_encoded = json.dumps(simplified_labels)
    with open(file_path, 'w') as f:
        f.write(labels_in_memory_encoded)
