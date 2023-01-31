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
import dataclasses
import logging
import os
import random
import shutil
import sys
import threading
import time

import jsonpickle
import ujson as json
import pandas as pd

from pathlib import Path
from collections import Counter, defaultdict
from typing import Sequence, Iterable, Mapping, List, Union, Set

import label_sleuth.data_access.file_based.utils as utils
from label_sleuth.data_access.core.data_structs import Document, Label, TextElement, LabelType
from label_sleuth.data_access.data_access_api import DataAccessApi, AlreadyExistsException, DocumentStatistics, \
    LabeledStatus


class FileBasedDataAccess(DataAccessApi):
    """
    Under the FileBasedDataAccess implementation of DataAccessApi, information about labels and TextElements is stored
    in the file system, as well as in memory, in the variables "ds_in_memory" and "labels_in_memory" below.
    Note that while label information changes over time (as labels are added, altered etc.), the TextElement information
    inside "ds_in_memory" only changes if new documents are added to the dataset.

    ===ds_in_memory===
    maps dataset_name to a pandas DataFrame containing all the dataset text elements

    ===labels_in_memory===
    maps workspace_id -> dataset name -> URIs -> categories -> Label object

    """
    doc_dir_name = 'doc_dump'
    sentences_filename = 'dataset_sentences.csv'
    labels_filename = 'workspace_labels.json'

    workspace_to_labels_lock_objects = defaultdict(threading.Lock)
    ds_in_memory = defaultdict(pd.DataFrame)
    labels_in_memory = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: defaultdict(Label))))
    dataset_in_memory_lock = threading.RLock()

    def __init__(self, output_dir):
        self.output_dir = output_dir

    def add_documents(self, dataset_name: str, documents: Iterable[Document]):
        """
        Add new documents to a given dataset; If dataset does not exist, create it.

        In this implementation, the same data is stored in two formats:
            A. a json file per Document, containing data for the TextElement objects within that Document
            B. a single csv file, containing data for the TextElement objects from all Documents for this dataset

        :param dataset_name: the name of the dataset to which the documents should be added.
        :param documents: an Iterable over Document type.
        """
        doc_dump_dir = self._get_documents_dump_dir(dataset_name)
        sentences = []
        if not os.path.exists(doc_dump_dir):
            os.makedirs(doc_dump_dir)
        else:
            doc_ids = {document.uri for document in documents}
            intersection = doc_ids.intersection(set(self.get_all_document_uris(dataset_name)))
            if len(intersection) > 0:
                raise AlreadyExistsException(f"{len(intersection)} documents are already in dataset '{dataset_name}'. "
                                             f"uris: ({list(intersection)[:5]}{'...' if len(intersection) > 5 else ''})",
                                             list(intersection))

        for doc in documents:
            # save doc to file
            filename = utils.uri_to_filename(doc.uri)
            file_path = os.path.join(doc_dump_dir, filename)
            doc_encoded = jsonpickle.encode(doc)
            with open(file_path + '.json', 'w') as f:
                f.write(doc_encoded)
            # add doc sentences to working memory
            sentences.extend(doc.text_elements)
        self._add_sentences_to_dataset_in_memory(dataset_name=dataset_name, text_elements=sentences)

        num_of_text_elements = sum([len(doc.text_elements) for doc in documents])
        logging.info(f'{dataset_name}:\t\tloaded {len(documents)} documents '
                     f'({num_of_text_elements} text elements) under {doc_dump_dir}')
        return DocumentStatistics(len(documents), num_of_text_elements)

    def set_labels(self, workspace_id: str, uris_to_labels: Mapping[str, Mapping[int, Label]],
                   apply_to_duplicate_texts=False):
        """
        Set labels to TextElements in dataset for a given workspace_id.

        :param workspace_id: the workspace_id of the labeling effort.
        :param uris_to_labels: list of tuples of TextElement URI and a dict that represents a label.
        The dict keys are category ids and values are Labels. For example: [(uri_1, {0: Label_cat_1}),
                                                                            (uri_2, {0: Label_cat_1,
                                                                                     1: Label_cat_2})]
        :param apply_to_duplicate_texts: if True, also set the same labels for additional URIs that are duplicates
        of the URIs provided.
        """

        # Assuming all elements are from the same dataset, using the first element's dataset name
        dataset_name = utils.get_dataset_name_from_uri(next(iter(uris_to_labels.keys())))
        with self._get_lock_object_for_workspace(workspace_id):
            ds_labels = self._get_labels(workspace_id, dataset_name)
            all_uris = self.get_all_text_elements_uris(dataset_name)
            for uri, labels in uris_to_labels.items():
                if uri not in all_uris:
                    raise Exception(f'Trying to set labels for uri "{uri}" which does not exist')

                if apply_to_duplicate_texts:  # set the given label for all elements with the same text
                    same_text_uris = self._get_uris_with_the_same_text(dataset_name, uri)
                    for same_text_uri in same_text_uris:
                        ds_labels[same_text_uri].update(labels)
                else:
                    # Note: we do not override existing labels if they are from another category
                    ds_labels[uri].update(labels)
            # Save updated labels dict to disk
            self._save_labels_data(dataset_name, workspace_id)

    def unset_labels(self, workspace_id: str, category_id: int, uris: Sequence[str], apply_to_duplicate_texts=False):
        """
        Remove workspace labels for a certain category from a specified list of uris.

        :param workspace_id: the workspace_id of the labeling effort.
        :param category_id: the id of the category labels are assigned to.
        :param uris: list of URIs to unset the label for.
        :param apply_to_duplicate_texts: if True, also unset the same labels for additional URIs that have the same text
        as that of the URIs provided.
        """
        dataset_name = utils.get_dataset_name_from_uri(uris[0])
        with self._get_lock_object_for_workspace(workspace_id):
            ds_labels = self._get_labels(workspace_id, dataset_name)
            all_uris = self.get_all_text_elements_uris(dataset_name)
            for uri in uris:
                if uri not in all_uris:
                    raise Exception(f'Trying to unset labels for uri "{uri}" which does not exist')

                if apply_to_duplicate_texts:  # unset the given label for all elements with the same text
                    same_text_uris = self._get_uris_with_the_same_text(dataset_name, uri)
                    for same_text_uri in same_text_uris:
                        ds_labels[same_text_uri].pop(category_id)
                        if len(ds_labels[same_text_uri]) == 0:
                            ds_labels.pop(same_text_uri)
                else:
                    ds_labels[uri].pop(category_id)
                    if len(ds_labels[uri]) == 0:
                        ds_labels.pop(uri)
            # Save updated labels dict to disk
            self._save_labels_data(dataset_name, workspace_id)

    def get_documents(self, workspace_id: Union[None, str], dataset_name: str, uris: Iterable[str],
                      label_types: Union[None,Set[LabelType]] = frozenset({LabelType.Standard})) \
            -> List[Document]:
        """
        Return a List of Documents, from the given dataset_name, matching the uris provided, and add the label
        information for the workspace to the TextElements of these Documents, if available.

        :param workspace_id: the workspace_id of the labeling effort. if None, documents are returned without
        label information
        :param dataset_name: the name of the dataset from which the documents should be retrieved.
        :param uris: an Iterable of uris of Documents, represented as string.
        :param label_types:  If workspace_id is provided, select which label_types to retrieve
                     by default, only the LabelType.Standard (strong labels) are retrieved.
        :return: a List of Document objects, from the given dataset_name, matching the uris provided, containing label
        information for the TextElements of these Documents, if available.
        """

        def load_doc(uri):
            filename = utils.uri_to_filename(uri)
            file_path = os.path.join(doc_dump_dir, filename)
            with open(file_path + '.json') as json_file:
                doc_encoded = json_file.read()
            doc = jsonpickle.decode(doc_encoded)
            return doc

        doc_dump_dir = self._get_documents_dump_dir(dataset_name)
        docs = [load_doc(uri) for uri in uris]
        if workspace_id is not None:
            with self._get_lock_object_for_workspace(workspace_id):
                for d in docs:
                    self._add_labels_info_for_text_elements(workspace_id=workspace_id, dataset_name=dataset_name,
                                                            text_elements=d.text_elements, label_types=label_types)
        return docs

    def get_all_document_uris(self, dataset_name: str) -> List[str]:
        """
        Return a List of all Document uris in the given dataset_name.

        :param dataset_name: the name of the dataset from which the Document uris should be retrieved.
        :return: a List of all Document uris in the given dataset_name.
        """
        uris = []
        doc_dump_dir = self._get_documents_dump_dir(dataset_name)
        for filename in os.listdir(doc_dump_dir):
            filename, file_extension = os.path.splitext(filename)
            uris.append(utils.filename_to_uri(filename))
        uris = sorted(uris, key=utils.get_sort_key_by_document_name)
        return uris

    def get_all_text_elements_uris(self, dataset_name: str) -> List[str]:
        """
        Return a List of all TextElement uris in the given dataset_name.

        :param dataset_name: the name of the dataset from which the TextElement uris should be retrieved.
        :return: a List of all TextElement uris in the given dataset_name.
        """
        return list(self._get_ds_in_memory(dataset_name)['uri'].values)

    def get_text_element_count(self, dataset_name: str) -> int:
        """
        Return the total number of TextElements in the given dataset_name.
        :param dataset_name:
        """
        return len(self.get_all_text_elements_uris(dataset_name))

    def get_all_text_elements(self, dataset_name: str) -> List[TextElement]:
        """
        Return a List of all TextElement in the given dataset_name.

        :param dataset_name: the name of the dataset from which the TextElement should be retrieved.
        """
        return utils.build_text_elements_from_dataframe_and_labels(self._get_ds_in_memory(dataset_name), labels_dict={})

    def get_text_elements(self, workspace_id: str, dataset_name: str, sample_size: int = sys.maxsize,
                          sample_start_idx: int = 0, query: str = None, is_regex: bool = False, document_uri=None,
                          remove_duplicates=False, random_state: int = 0) -> Mapping:
        """
        Sample *sample_size* TextElements from dataset_name, optionally limiting to those matching a query,
        and add their labels information for workspace_id, if available.

        :param workspace_id: the workspace_id of the labeling effort.
        :param dataset_name: the name of the dataset from which TextElements are sampled
        :param sample_size: how many TextElements should be sampled
        :param sample_start_idx: get elements starting from this index (for pagination). Default is 0
        :param query: a query string to search for in the sampled TextElements.
                      If None, then no such filtering is performed.
        :param is_regex: if True, the query string is interpreted as a regular expression (False by default)
        :param document_uri: get elements from a particular document
        :param remove_duplicates: if True, do not include elements that are duplicates of each other.
        :param random_state: provide an int seed to define a random state. Default is zero.
        :return: a dictionary with two keys: 'results' whose value is a list of TextElements, and 'hit_count' whose
        value is the total number of TextElements in the dataset matched by the query.
        {'results': [TextElement], 'hit_count': int}
        """
        with self._get_lock_object_for_workspace(workspace_id):
            results_dict = \
                self._get_text_elements(
                    workspace_id=workspace_id, dataset_name=dataset_name,
                    filter_func=lambda df, _: utils.filter_by_query_and_document_uri(df, query, is_regex, document_uri),
                    sample_size=sample_size, sample_start_idx=sample_start_idx,
                    remove_duplicates=remove_duplicates, random_state=random_state)

        return results_dict

    def get_unlabeled_text_elements(self, workspace_id: str, dataset_name: str, category_id: int,
                                    sample_size: int = sys.maxsize, sample_start_idx: int = 0,
                                    query: str = None, is_regex: bool = False,
                                    remove_duplicates=False, random_state: int = 0) -> Mapping:
        """
        Sample *sample_size* TextElements from dataset_name, unlabeled for category_id in workspace_id, optionally
        limiting to those matching a query.

        :param workspace_id: the workspace_id of the labeling effort.
        :param dataset_name: the name of the dataset from which TextElements are sampled
        :param category_id: we demand that the elements are not labeled for this category
        :param sample_size: how many TextElements should be sampled
        :param sample_start_idx: get elements starting from this index (for pagination). Default is 0
        :param query: a query string to search for in the sampled TextElements.
                      If None, then no such filtering is performed.
        :param is_regex: if True, the query string is interpreted as a regular expression (False by default)
        :param remove_duplicates: if True, do not include elements that are duplicates of each other.
        :param random_state: provide an int seed to define a random state. Default is zero.
        :return: a dictionary with two keys: 'results' whose value is a list of TextElements, and 'hit_count' whose
        value is the total number of TextElements in the dataset matched by the query.
        {'results': [TextElement], 'hit_count': int}
        """
        filter_func = lambda df, labels: \
            utils.filter_by_query_and_label_status(df, labels, category_id, LabeledStatus.UNLABELED, query, is_regex)

        with self._get_lock_object_for_workspace(workspace_id):
            results_dict = self._get_text_elements(workspace_id=workspace_id, dataset_name=dataset_name,
                                                   filter_func=filter_func, sample_size=sample_size,
                                                   sample_start_idx=sample_start_idx,
                                                   remove_duplicates=remove_duplicates, random_state=random_state)
        return results_dict

    def get_labeled_text_elements(self, workspace_id: str, dataset_name: str, category_id: int,
                                  sample_size: int = sys.maxsize, query: str = None, is_regex: bool = False,
                                  remove_duplicates=False, random_state: int = 0,
                                  label_types: Set[LabelType] = frozenset({LabelType.Standard})) -> Mapping:
        """
        Sample *sample_size* TextElements from dataset_name, labeled for category_id in workspace_id,
        optionally limiting to those matching a query.

        :param workspace_id: the workspace_id of the labeling effort.
        :param dataset_name: the name of the dataset from which TextElements are sampled
        :param category_id: we demand that the elements are labeled for this category
        :param sample_size: how many TextElements should be sampled
        :param query: a query string to search for in the sampled TextElements.
                      If None, then no such filtering is performed.
        :param is_regex: if True, the query string is interpreted as a regular expression (False by default)
        :param remove_duplicates: if True, do not include elements that are duplicates of each other.
        :param random_state: provide an int seed to define a random state. Default is zero.
        :param label_types: by default, only the LabelType.Standard (strong labels) are retrieved.
        :return: a dictionary with two keys: 'results' whose value is a list of TextElements, and 'hit_count' whose
        value is the total number of TextElements in the dataset matched by the query.
        {'results': [TextElement], 'hit_count': int}
        """

        filter_func = lambda df, labels: \
            utils.filter_by_query_and_label_status(df, labels, category_id, LabeledStatus.LABELED, query, is_regex,
                                                   label_types=label_types)
        with self._get_lock_object_for_workspace(workspace_id):
            results_dict = self._get_text_elements(workspace_id=workspace_id, dataset_name=dataset_name,
                                                   filter_func=filter_func, sample_size=sample_size,
                                                   remove_duplicates=remove_duplicates, random_state=random_state)
        return results_dict

    def get_label_counts(self, workspace_id: str, dataset_name: str, category_id: int, remove_duplicates=False,
                         label_types: Set[LabelType] = frozenset(LabelType._member_map_.values()),
                         fine_grained_counts=True) -> Mapping[Union[str, bool], int]:
        """
        Return for each label value, assigned to category_id, the total count of its appearances in dataset_name.
        :param workspace_id: the workspace_id of the labeling effort.
        :param dataset_name: the name of the dataset from which labels count should be generated
        :param category_id: the id of the category whose label information is the target
        :param remove_duplicates: if True, do not include elements that are duplicates of each other.
        :param label_types: by default, labels of all types are retrieved.
        :param fine_grained_counts: if True, count labels of each label type separately.
        :return: a map whose keys are label values, and the values are the number of TextElements this label was
        assigned to.
        """
        labels_by_uri = self._get_labels(workspace_id=workspace_id, dataset_name=dataset_name).copy()
        if remove_duplicates:
            corpus_df = self._get_ds_in_memory(dataset_name=dataset_name)
            labeled_df = corpus_df[corpus_df['uri'].isin(labels_by_uri)]
            uris_to_keep = set(labeled_df.drop_duplicates(subset=['text'])['uri'])
            labels_by_uri = {uri: category_to_label for uri, category_to_label in labels_by_uri.items()
                             if uri in uris_to_keep}

        category_label_list = \
            [category_to_label[category_id] for category_to_label in labels_by_uri.values()
             if category_id in category_to_label and category_to_label[category_id].label_type in label_types]

        if fine_grained_counts:
            return Counter(lbl_obj.get_detailed_label_name() for lbl_obj in category_label_list)
        else:
            return Counter(lbl_obj.label for lbl_obj in category_label_list)

    def delete_all_labels(self, workspace_id, dataset_name):
        """
        Delete the labels info of the given workspace_id for the given dataset (other labels info files are kept).
        :param workspace_id:
        :param dataset_name:
        """
        labels_file = self._get_workspace_labels_dump_filename(workspace_id, dataset_name)
        if os.path.isfile(labels_file):
            os.remove(labels_file)
        workspace_dumps_dir = self._get_workspace_labels_dir(workspace_id)
        if os.path.exists(workspace_dumps_dir) and len(os.listdir(workspace_dumps_dir)) == 0:
            os.rmdir(workspace_dumps_dir)

    def delete_labels_for_category(self, workspace_id, dataset_name, category_id):
        """
        Delete the labels info associated with the given category.
        :param workspace_id:
        :param dataset_name:
        :param category_id:
        """
        labeled_elements = self.get_labeled_text_elements(workspace_id, dataset_name, category_id,
                                                          sample_size=sys.maxsize)['results']
        if len(labeled_elements) > 0:
            self.unset_labels(workspace_id, category_id, [e.uri for e in labeled_elements])

    def get_text_elements_by_uris(self, workspace_id: str, dataset_name: str, uris: Iterable[str],
                                  label_types: Set[LabelType] = frozenset({LabelType.Standard}))\
                                                                                    -> List[TextElement]:
        """
        Return a List of TextElement objects from the given dataset_name, matching the uris provided, and add the label
        information for the workspace to these TextElements, if available.
        :param workspace_id:
        :param dataset_name:
        :param uris:
        :param label_types:  by default, only the LabelType.Standard (strong labels) are retrieved.
        """
        corpus_df = self._get_ds_in_memory(dataset_name)
        uris = list(uris)
        corpus_df = corpus_df.loc[corpus_df['uri'].isin(uris)]
        text_elements_by_uri = {te.uri: te for te
                                in utils.build_text_elements_from_dataframe_and_labels(corpus_df, labels_dict={})}
        text_elements = [text_elements_by_uri.get(uri) for uri in uris]

        with self._get_lock_object_for_workspace(workspace_id):
            text_elements = self._add_labels_info_for_text_elements(workspace_id,
                                                                    dataset_name, text_elements, label_types)

        return text_elements

    def get_text_element_iterator(self, workspace_id, dataset_name, shuffle=False, random_state: int = 0,
                                  remove_duplicates=False) -> Iterable[TextElement]:
        """
        Enables iterating over TextElement objects from the given *dataset_name*. Particularly useful where the total
        number of elements required is not known in advance.
        :param workspace_id:
        :param dataset_name:
        :param shuffle: if True, the iterator yields the text elements in random order.
        :param random_state: provide an int seed to define a random state. Default is zero.
        :param remove_duplicates: if True, do not include elements that are duplicates of each other.
        """
        corpus_df = self._get_ds_in_memory(dataset_name)
        if remove_duplicates:
            corpus_df = corpus_df.drop_duplicates(subset=['text'])
        all_uris = list(corpus_df['uri'].values)
        if shuffle:
            random.Random(random_state).shuffle(all_uris)

        # extracting one element at a time from a large dataframe can be expensive, so we fetch them in batches
        # but yield them one by one
        batch_size = 1000
        for i in range(0, len(all_uris), batch_size):
            batch_uris = all_uris[i:i + batch_size]
            yield from self.get_text_elements_by_uris(workspace_id, dataset_name, batch_uris)

    def get_all_dataset_names(self) -> List[str]:
        """
        :return: a list of all available datset names
        """
        path = self._get_datasets_base_dir()
        return [name for name in os.listdir(path) if os.path.isdir(os.path.join(path, name))]

    def delete_dataset(self, dataset_name):
        """
        Delete dataset by name
        :param dataset_name:
        """
        logging.info(f"Deleting dataset '{dataset_name}'")
        dataset_dir = self._get_dataset_base_dir(dataset_name)
        if os.path.isdir(dataset_dir):
            shutil.rmtree(dataset_dir)
        if dataset_name in self.ds_in_memory:
            del self.ds_in_memory[dataset_name]

    def _get_lock_object_for_workspace(self, workspace_id: str):
        lock_object = self.workspace_to_labels_lock_objects[workspace_id]
        return lock_object

    def _get_ds_in_memory(self, dataset_name):
        with self.dataset_in_memory_lock:
            if dataset_name not in self.ds_in_memory:
                if self._dataset_exists(dataset_name):
                    logging.info(f"reading dataset '{dataset_name}' csv file")
                    dataset_file_path = self._get_dataset_dump_filename(dataset_name)

                    df = pd.read_csv(dataset_file_path, converters=
                            {"span": lambda span: [tuple(int(x) for x in span[2:-2].split(','))],
                             "metadata": lambda metadata: ast.literal_eval(metadata) if metadata != '{}' else {}})

                    logging.info(f"csv file for dataset '{dataset_name}' read and processed successfully")
                else:
                    raise Exception(f'Dataset "{dataset_name}" does not exist.')
                self.ds_in_memory[dataset_name] = df
            res = self.ds_in_memory[dataset_name]
        return res

    def _get_labels(self, workspace_id, dataset_name):
        if workspace_id not in self.labels_in_memory or dataset_name not in self.labels_in_memory[workspace_id]:
            file_path = self._get_workspace_labels_dump_filename(workspace_id, dataset_name)
            if os.path.isfile(file_path):
                # Read dict from disk
                with open(file_path) as f:
                    labels_encoded = f.read()
                simplified_dict = json.loads(labels_encoded)
                for uri, category_to_label in simplified_dict.items():
                    for category_id, label_dict in category_to_label.items():
                        self.labels_in_memory[workspace_id][dataset_name][uri][int(category_id)] = Label(**label_dict)
            else:
                # Save empty dict to disk
                os.makedirs(Path(file_path).parent, exist_ok=True)
                empty_dict_encoded = json.dumps(self.labels_in_memory[workspace_id][dataset_name])
                with open(file_path, 'w') as f:
                    f.write(empty_dict_encoded)
        return self.labels_in_memory[workspace_id][dataset_name]

    def _add_sentences_to_dataset_in_memory(self, dataset_name, text_elements: Iterable[TextElement]):
        if self._dataset_exists(dataset_name):
            self.ds_in_memory[dataset_name] = self._get_ds_in_memory(dataset_name)
        dicts = [dataclasses.asdict(s) for s in text_elements]
        [d.pop('category_to_label') for d in dicts]  # category_to_labels is not saved in the dataframe
        new_sentences_df = pd.DataFrame(dicts)
        if dataset_name in self.ds_in_memory:
            self.ds_in_memory[dataset_name] = self.ds_in_memory[dataset_name].append(new_sentences_df, sort=False)
        else:
            self.ds_in_memory[dataset_name] = new_sentences_df
        self.ds_in_memory[dataset_name] = self._add_text_unique_ids(self.ds_in_memory[dataset_name])
        self.ds_in_memory[dataset_name].to_csv(self._get_dataset_dump_filename(dataset_name), index=False)

    def _add_labels_info_for_text_elements(self, workspace_id, dataset_name, text_elements: List[TextElement],
                                           label_types):
        labels_info_for_workspace = self._get_labels(workspace_id, dataset_name)
        for elem in text_elements:
            if elem.uri in labels_info_for_workspace:
                if label_types is None:
                    elem.category_to_label = labels_info_for_workspace[elem.uri].copy()
                else:
                    elem.category_to_label = {cat:label for cat, label in labels_info_for_workspace[elem.uri].items()
                                              if label.label_type in label_types}
        return text_elements

    def _get_text_elements(self, workspace_id: str, dataset_name: str, filter_func, sample_size: int,
                           sample_start_idx=0, remove_duplicates=False, random_state: int = 0) -> Mapping:
        """
        :param workspace_id: if None no labels info would be used or output
        :param dataset_name:
        :param filter_func:
        :param sample_size: number of elements to return. if None, return all elements without sampling
        :param sample_start_idx: get elements starting from this index (for pagination)
        :param remove_duplicates:
        :param random_state: provide an int seed to define a random state. Default is zero.
        """
        corpus_df = self._get_ds_in_memory(dataset_name)
        if workspace_id:
            labels_dict = self._get_labels(workspace_id, dataset_name)
        else:
            labels_dict = {}
        labels_series = corpus_df['uri'].apply(lambda u: labels_dict[u] if u in labels_dict else {})
        corpus_df = filter_func(corpus_df, labels_series)

        results_dict = {'hit_count': len(corpus_df)}
        if remove_duplicates:
            unique_texts = set()
            corpus_df = corpus_df.loc[
                corpus_df['text'].apply(lambda x: x not in unique_texts and not unique_texts.add(x))]
            results_dict['hit_count_unique'] = len(corpus_df)

        if sample_size is not None:
            # TODO UNKNOWN BUG fix
            corpus_df = corpus_df.sample(n=min(sample_size + sample_start_idx, len(corpus_df)),
                                         random_state=random_state
                                         )[sample_start_idx:sample_start_idx + sample_size]

        results_dict['results'] = utils.build_text_elements_from_dataframe_and_labels(corpus_df, labels_dict)
        return results_dict

    def _save_labels_data(self, dataset_name, workspace_id):
        file_path = self._get_workspace_labels_dump_filename(workspace_id, dataset_name)
        os.makedirs(Path(file_path).parent, exist_ok=True)
        labels = self.labels_in_memory[workspace_id][dataset_name]
        simplified_labels = {k: {str(category_id): label.to_dict() for category_id, label in v.items()}
                             for k, v in labels.items()}
        labels_in_memory_encoded = json.dumps(simplified_labels)
        with open(file_path, 'w') as f:
            f.write(labels_in_memory_encoded)

    @staticmethod
    def _add_text_unique_ids(df):
        """
        To facilitate extraction of duplicate elements, i.e. text elements that have the same text, we assign an id to
        each unique text in the dataframe. Whenever new documents are added to the corpus, these ids are recalculated.
        """
        unique_to_id = {}
        df['text_unique_id'] = df['text'].apply(
            lambda x: len(unique_to_id) - 1 if x not in unique_to_id and not unique_to_id.update({x: len(unique_to_id)})
            else unique_to_id[x])
        return df

    def _get_uris_with_the_same_text(self, dataset_name, uri):
        ds_in_memory = self._get_ds_in_memory(dataset_name)
        text_unique_id = ds_in_memory[ds_in_memory['uri'] == uri]['text_unique_id'].values[0]
        return ds_in_memory[ds_in_memory['text_unique_id'] == text_unique_id]['uri']

    def _dataset_exists(self, dataset_name):
        return os.path.exists(self._get_dataset_dump_filename(dataset_name))

    def _get_dataset_base_dir(self, dataset_name):
        return os.path.join(self._get_datasets_base_dir(), dataset_name)

    def _get_datasets_base_dir(self):
        data_access_dumps_path = os.path.join(self.output_dir, 'data_access_dumps')
        os.makedirs(data_access_dumps_path, exist_ok=True)
        return data_access_dumps_path

    def _get_documents_dump_dir(self, dataset_name):
        return os.path.join(self._get_dataset_base_dir(dataset_name), self.doc_dir_name)

    def _get_dataset_dump_filename(self, dataset_name):
        return os.path.join(self._get_dataset_base_dir(dataset_name), self.sentences_filename)

    def _get_workspace_labels_dump_filename(self, workspace_id, dataset_name):
        workspace_dir = self._get_workspace_labels_dir(workspace_id)
        return os.path.join(workspace_dir, str(dataset_name) + '_' + self.labels_filename)

    def _get_workspace_labels_dir(self, workspace_id):
        return os.path.join(self.output_dir, 'user_labels', str(workspace_id))

    def preload_dataset(self, dataset_name):
        self._get_ds_in_memory(dataset_name)
