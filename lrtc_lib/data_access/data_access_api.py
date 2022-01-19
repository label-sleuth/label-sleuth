# (c) Copyright IBM Corporation 2020.

# LICENSE: Apache License 2.0 (Apache-2.0)
# http://www.apache.org/licenses/LICENSE-2.0

import abc
from typing import Iterable, Sequence, Mapping, List, Tuple
from lrtc_lib.data_access.core.data_structs import Document, TextElement, Label


class AlreadyExistException(Exception):
    def __init__(self, message, documents):
        self.message = message
        self.documents = documents


class DataAccessApi(object, metaclass=abc.ABCMeta):
    @abc.abstractmethod
    def add_documents(self, dataset_name: str, documents: Iterable[Document]):
        """
        Add new documents to a given dataset; If dataset does not exist, create it.

        :param dataset_name: the name of the dataset to which the documents should be added.
        :param documents: an Iterable over Document type.
        """
        func_name = self.add_documents.__name__
        raise NotImplementedError('users must define ' + func_name + ' to use this base class')

    @abc.abstractmethod
    def set_labels(self, workspace_id: str, texts_and_labels: Sequence[Tuple[str, Mapping[str, Label]]],
                   propagate_to_duplicates=False):
        """
        Set labels to TextElements in dataset for a given workspace_id.

        :param workspace_id: the workspace_id of the labeling effort.
        :param texts_and_labels: list of tuples of TextElement URI and a dict that represents a label.
        The dict keys are category names and values are Labels. For example: [(uri_1, {category_1: Label_cat_1}),
                                                                              (uri_2, {category_1: Label_cat_1,
                                                                                       category_2: Label_cat_2})]
        :param propagate_to_duplicates: if True, also set the same labels for additional URIs that are duplicates
        of the URIs provided.
        """
        func_name = self.set_labels.__name__
        raise NotImplementedError('users must define ' + func_name + ' to use this base class')

    @abc.abstractmethod
    def unset_labels(self, workspace_id: str, category_name, uris: Sequence[str]):
        """
        Unset labels to TextElements in dataset for a given workspace_id and category.

        :param workspace_id: the workspace_id of the labeling effort.
        :param category_name: the name of the category labels are assigned to.
        :param uris: list of URIs to unset the label for.
        """
        func_name = self.unset_labels.__name__
        raise NotImplementedError('users must define ' + func_name + ' to use this base class')

    @abc.abstractmethod
    def get_documents(self, dataset_name: str, uris: Iterable[str]) -> List[Document]:
        """
        Return a List of Document objects, from the given dataset_name, matching the uris provided.

        :param dataset_name: the name of the dataset from which the documents should be retrieved.
        :param uris: an Iterable of uris of Documents, represented as string.
        :return: a List of Document, from the given dataset_name, matching the uris provided.
        """
        func_name = self.get_documents.__name__
        raise NotImplementedError('users must define ' + func_name + ' to use this base class')

    @abc.abstractmethod
    def get_documents_with_labels_info(self, workspace_id: str, dataset_name: str, uris: Iterable[str]) \
            -> List[Document]:
        """
        Return a List of Documents, from the given dataset_name, matching the uris provided, and add the label
        information for the workspace to the TextElements of these Documents, if available.

        :param workspace_id: the workspace_id of the labeling effort.
        :param dataset_name: the name of the dataset from which the documents should be retrieved.
        :param uris: an Iterable of uris of Documents, represented as string.
        :return: a List of Documents, from the given dataset_name, matching the uris provided, containing label
        information for the TextElements of these Documents, if available.
        """
        func_name = self.get_documents_with_labels_info.__name__
        raise NotImplementedError('users must define ' + func_name + ' to use this base class')

    @abc.abstractmethod
    def get_all_document_uris(self, dataset_name: str) -> List[str]:
        """
        Return a List of all Document uris in the given dataset_name.

        :param dataset_name: the name of the dataset from which the Document uris should be retrieved.
        :return: a List of all Document uris in the given dataset_name.
        """
        func_name = self.get_all_document_uris.__name__
        raise NotImplementedError('users must define ' + func_name + ' to use this base class')

    @abc.abstractmethod
    def get_all_text_elements_uris(self, dataset_name: str) -> List[str]:
        """
        Return a List of all TextElement uris in the given dataset_name.

        :param dataset_name: the name of the dataset from which the TextElement uris should be retrieved.
        :return: a List of all TextElement uris in the given dataset_name.
        """
        func_name = self.get_all_text_elements_uris.__name__
        raise NotImplementedError('users must define ' + func_name + ' to use this base class')

    @abc.abstractmethod
    def get_all_text_elements(self, dataset_name: str) -> List[TextElement]:
        """
        Return a List of all TextElement in the given dataset_name.

        :param dataset_name: the name of the dataset from which the TextElement should be retrieved.
        """
        func_name = self.get_all_text_elements.__name__
        raise NotImplementedError('users must define ' + func_name + ' to use this base class')

    @abc.abstractmethod
    def sample_text_elements(self, dataset_name: str, sample_size: int, query: str = None, remove_duplicates=False,
                             random_state: int = 0) -> Mapping:
        """
        Sample *sample_size* TextElements from dataset_name, optionally limiting to those matching a query.

        :param dataset_name: the name of the dataset from which TextElements are sampled
        :param sample_size: how many TextElements should be sampled
        :param query: a regular expression that should be matched in the sampled TextElements. If None, then no such
        filtering is performed.
        :param remove_duplicates: if True, do not include elements that are duplicates of each other.
        :param random_state: provide an int seed to define a random state. Default is zero.
        :return: a dictionary with two keys: 'results' whose value is a list of TextElements, and 'hit_count' whose
        value is the total number of TextElements in the dataset matched by the query.
        {'results': [TextElement], 'hit_count': int}
        """
        func_name = self.sample_text_elements.__name__
        raise NotImplementedError('users must define ' + func_name + ' to use this base class')

    @abc.abstractmethod
    def sample_text_elements_with_labels_info(self, workspace_id: str, dataset_name: str, sample_size: int,
                                              sample_start_idx=0,
                                              query: str = None, remove_duplicates=False,
                                              random_state: int = 0) -> Mapping:
        """
        Sample *sample_size* TextElements from dataset_name, optionally limiting to those matching a query,
        and add their labels information for workspace_id, if available.

        :param workspace_id: the workspace_id of the labeling effort.
        :param dataset_name: the name of the dataset from which TextElements are sampled
        :param sample_size: how many TextElements should be sampled
        :param sample_start_idx: get elements starting from this index (for paging)
        :param query: a regular expression that should be matched in the sampled TextElements. If None, then no such
        filtering is performed.
        :param remove_duplicates: if True, do not include elements that are duplicates of each other.
        :param random_state: provide an int seed to define a random state. Default is zero.
        :return: a dictionary with two keys: 'results' whose value is a list of TextElements, and 'hit_count' whose
        value is the total number of TextElements in the dataset matched by the query.
        {'results': [TextElement], 'hit_count': int}
        """
        func_name = self.sample_text_elements_with_labels_info.__name__
        raise NotImplementedError('users must define ' + func_name + ' to use this base class')

    @abc.abstractmethod
    def sample_unlabeled_text_elements(self, workspace_id: str, dataset_name: str, category_name: str, sample_size: int,
                                       sample_start_idx:int = 0,
                                       query: str = None, remove_duplicates=False,
                                       random_state: int = 0) -> Mapping:
        """
        Sample *sample_size* TextElements from dataset_name, unlabeled for category_name in workspace_id, optionally
        limiting to those matching a query.

        :param workspace_id: the workspace_id of the labeling effort.
        :param dataset_name: the name of the dataset from which TextElements are sampled
        :param category_name: the name of the category whose label information are the target of this sample
        :param sample_size: how many TextElements should be sampled
        :param sample_start_idx: get elements starting from this index (for paging)
        :param query: a regular expression that should be matched in the sampled TextElements. If None, then no such
        filtering is performed.
        :param remove_duplicates: if True, do not include elements that are duplicates of each other.
        :param random_state: provide an int seed to define a random state. Default is zero.
        :return: a dictionary with two keys: 'results' whose value is a list of TextElements, and 'hit_count' whose
        value is the total number of TextElements in the dataset matched by the query.
        {'results': [TextElement], 'hit_count': int}
        """
        func_name = self.sample_unlabeled_text_elements.__name__
        raise NotImplementedError('users must define ' + func_name + ' to use this base class')

    @abc.abstractmethod
    def sample_labeled_text_elements(self, workspace_id: str, dataset_name: str, category_name: str, sample_size: int,
                                     query: str = None, remove_duplicates=False,
                                     random_state: int = 0) -> Mapping:
        """
        Sample *sample_size* TextElements from dataset_name, labeled for category_name in workspace_id,
        optionally limiting to those matching a query.

        :param workspace_id: the workspace_id of the labeling effort.
        :param dataset_name: the name of the dataset from which TextElements are sampled
        :param category_name: the name of the category whose label information are the target of this sample
        :param sample_size: how many TextElements should be sampled
        :param query: a regular expression that should be matched in the sampled TextElements. If None, then no such
        filtering is performed.
        :param remove_duplicates: if True, do not include elements that are duplicates of each other.
        :param random_state: provide an int seed to define a random state. Default is zero.
        :return: a dictionary with two keys: 'results' whose value is a list of TextElements, and 'hit_count' whose
        value is the total number of TextElements in the dataset matched by the query.
        {'results': [TextElement], 'hit_count': int}
        """
        func_name = self.sample_labeled_text_elements.__name__
        raise NotImplementedError('users must define ' + func_name + ' to use this base class')

    @abc.abstractmethod
    def get_label_counts(self, workspace_id: str, dataset_name: str, category_name: str, remove_duplicates=False) \
            -> Mapping[str, int]:
        """
        Return for each label value, assigned to category_name, the total count of its appearances in dataset_name.
        :param workspace_id: the workspace_id of the labeling effort.
        :param dataset_name: the name of the dataset from which labels count should be generated
        :param category_name: the name of the category whose label information is the target
        :param remove_duplicates: if True, do not include elements that are duplicates of each other.
        :return: a map whose keys are label values, and the values are the number of TextElements this label was
        assigned to.
        """
        func_name = self.get_label_counts.__name__
        raise NotImplementedError('users must define ' + func_name + ' to use this base class')

    @abc.abstractmethod
    def copy_labels_to_new_workspace(self, old_worspace_id: str, new_workspace_id: str, dataset_name: str,
                                     dev_dataset_name: str):
        func_name = self.copy_labels_to_new_workspace.__name__
        raise NotImplementedError('users must define ' + func_name + ' to use this base class')

    @abc.abstractmethod
    def clear_saved_labels(self, workspace_id, dataset_name):
        """
        Delete the labels info of the given workspace_id for the given dataset.
        :param workspace_id:
        :param dataset_name:
        """
        func_name = self.clear_saved_labels.__name__
        raise NotImplementedError('users must define ' + func_name + ' to use this base class')


    @abc.abstractmethod
    def get_text_elements_by_uris(self, dataset_name, uris) -> List[TextElement]:
        func_name = self.get_text_elements_by_uris.__name__
        raise NotImplementedError('users must define ' + func_name + ' to use this base class')


    @abc.abstractmethod
    def get_text_elements_with_labels_info(self, workspace_id: str, dataset_name: str, uris: Iterable[str]) -> \
            List[TextElement]:
        """
        Return a List of TextElement objects from the given dataset_name, matching the uris provided, and add the label
        information for the workspace to these TextElements, if available.
        :param workspace_id:
        :param dataset_name:
        :param uris:
        """
        func_name = self.get_text_elements_with_labels_info.__name__
        raise NotImplementedError('users must define ' + func_name + ' to use this base class')

    @abc.abstractmethod
    def get_all_datasets(self) -> List[str]:
        func_name = self.get_all_datasets.__name__
        raise NotImplementedError('users must define ' + func_name + ' to use this base class')
