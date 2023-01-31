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

import abc
import sys
from dataclasses import dataclass
from enum import Enum

from typing import Iterable, Sequence, Mapping, List, Union, Set
from label_sleuth.data_access.core.data_structs import Document, TextElement, Label, URI_SEP, LabelType


class AlreadyExistsException(Exception):
    def __init__(self, message, documents):
        self.message = message
        self.documents = documents


@dataclass
class DocumentStatistics:
    documents_loaded: int
    text_elements_loaded: int


class LabeledStatus(Enum):
    UNLABELED = 0
    LABELED = 1
    ALL = 2


def get_document_uri(uri):
    """
    get document uri from element uri
    """
    return uri.rsplit(URI_SEP, 1)[0]


class DataAccessApi(object, metaclass=abc.ABCMeta):
    @abc.abstractmethod
    def add_documents(self, dataset_name: str, documents: Iterable[Document]) -> DocumentStatistics:
        """
        Add new documents to a given dataset; If dataset does not exist, create it.

        :param dataset_name: the name of the dataset to which the documents should be added.
        :param documents: an Iterable over Document type.
        """

    @abc.abstractmethod
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

    @abc.abstractmethod
    def unset_labels(self, workspace_id: str, category_id: int, uris: Sequence[str], apply_to_duplicate_texts=False):
        """
        Remove workspace labels for a certain category from a specified list of uris.

        :param workspace_id: the workspace_id of the labeling effort.
        :param category_id: the id of the category labels are assigned to.
        :param uris: list of URIs to unset the label for.
        :param apply_to_duplicate_texts: if True, also unset the same labels for additional URIs that have the same text
        as that of the URIs provided.
        """

    @abc.abstractmethod
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

    @abc.abstractmethod
    def get_all_document_uris(self, dataset_name: str) -> List[str]:
        """
        Return a List of all Document uris in the given dataset_name.

        :param dataset_name: the name of the dataset from which the Document uris should be retrieved.
        :return: a List of all Document uris in the given dataset_name.
        """

    @abc.abstractmethod
    def get_all_text_elements_uris(self, dataset_name: str) -> List[str]:
        """
        Return a List of all TextElement uris in the given dataset_name.

        :param dataset_name: the name of the dataset from which the TextElement uris should be retrieved.
        :return: a List of all TextElement uris in the given dataset_name.
        """

    @abc.abstractmethod
    def get_text_element_count(self, dataset_name: str) -> int:
        """
        Return the total number of TextElements in the given dataset_name.
        :param dataset_name:
        """

    @abc.abstractmethod
    def get_all_text_elements(self, dataset_name: str) -> List[TextElement]:
        """
        Return a List of all TextElement in the given dataset_name.

        :param dataset_name: the name of the dataset from which the TextElement should be retrieved.
        """

    @abc.abstractmethod
    def get_text_elements(self, workspace_id: str, dataset_name: str, sample_size: int = sys.maxsize,
                          sample_start_idx: int = 0, query: str = None, is_regex: bool = False,
                          remove_duplicates=False, document_uri=None, random_state: int = 0) -> Mapping:
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

    @abc.abstractmethod
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

    @abc.abstractmethod
    def get_labeled_text_elements(self, workspace_id: str, dataset_name: str, category_id: int,
                                  sample_size: int = sys.maxsize,
                                  query: str = None, is_regex: bool = False,
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

    @abc.abstractmethod
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

    @abc.abstractmethod
    def delete_all_labels(self, workspace_id, dataset_name):
        """
        Delete the labels info of the given workspace_id for the given dataset (other labels info files are kept).
        :param workspace_id:
        :param dataset_name:
        """

    @abc.abstractmethod
    def delete_labels_for_category(self, workspace_id: str, dataset_name: str, category_id: int):
        """
        Delete the labels info associated with the given category.
        :param workspace_id:
        :param dataset_name:
        :param category_id:
        """

    @abc.abstractmethod
    def get_text_elements_by_uris(self, workspace_id: str, dataset_name: str, uris: Iterable[str],
                                  label_types: Set[LabelType] = frozenset({LabelType.Standard})) -> List[TextElement]:
        """
        Return a List of TextElement objects from the given dataset_name, matching the uris provided, and add the label
        information for the workspace to these TextElements, if available.
        :param workspace_id:
        :param dataset_name:
        :param uris:
        :param label_types:  by default, only the LabelType.Standard (strong labels) are retrieved.
        """

    @abc.abstractmethod
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

    @abc.abstractmethod
    def get_all_dataset_names(self) -> List[str]:
        """
        :return: a list of all available datset names
        """

    @abc.abstractmethod
    def delete_dataset(self, dataset_name):
        """
        Delete dataset by name
        :param dataset_name:
        """

    @abc.abstractmethod
    def preload_dataset(self, dataset_name):
        """
        Preload dataset to memory
        :param dataset_name:
        """
