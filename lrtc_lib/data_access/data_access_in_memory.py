import os
import jsonpickle
from collections import Counter, defaultdict
from copy import deepcopy
from typing import Sequence, Iterable, Mapping, List, Tuple
import threading

import lrtc_lib.data_access.core.data_access_in_memory_logic as logic
import lrtc_lib.data_access.core.utils as utils
from lrtc_lib.data_access.core.data_access_in_memory_logic import LabeledStatus
from lrtc_lib.data_access.core.data_structs import Document, Label, TextElement
from lrtc_lib.data_access.data_access_api import DataAccessApi, AlreadyExistException


class DataAccessInMemory(DataAccessApi):
    DEFAULT_SAMPLE_SIZE = 300
    workspaces_labels_locks_dict = defaultdict(threading.Lock)

    def add_documents(self, dataset_name: str, documents: Iterable[Document]):
        """
        Add new documents to a given dataset; If dataset does not exist, create it.
        It is assumed that the entire dataset is loaded in a single call for this function.

        In this implementation, the same data is stored in two formats:
            A. a json file per Document, containing data for the TextElement objects within that Document
            B. a single csv file, containing data for the TextElement objects from all Documents for this dataset
        """
        doc_dump_dir = utils.get_documents_dump_dir(dataset_name)
        sentences = []
        if not os.path.exists(doc_dump_dir):
            os.makedirs(doc_dump_dir)
        else:
            doc_ids = {document.uri for document in documents}
            intersection = doc_ids.intersection(set(self.get_all_document_uris(dataset_name)))
            if len(intersection) > 0:
                raise AlreadyExistException(f"{len(intersection)} documents are already in dataset {dataset_name}."
                                            f" uris: ({intersection})", list(intersection))

        for doc in documents:
            # save doc to file
            filename = utils.uri_to_filename(doc.uri)
            file_path = os.path.join(doc_dump_dir, filename)
            doc_encoded = jsonpickle.encode(doc)
            with open(file_path + '.json', 'w') as f:
                f.write(doc_encoded)
            # add doc sentences to working memory
            sentences.extend(doc.text_elements)
        logic.add_sentences_to_dataset_in_memory(dataset_name=dataset_name, sentences=sentences)

    def get_lock_for_workspace(self, workspace_id: str):
        lock_object = self.workspaces_labels_locks_dict[workspace_id]
        return lock_object

    def unset_labels(self, workspace_id: str, category_name, uris: Sequence[str]):
        """
        Remove workspace labels for a certain category from a specified list of uris.

        :param workspace_id: the workspace_id of the labeling effort.
        :param category_name:
        :param uris:
        """
        dataset_name = utils.get_dataset_name(uris[0])
        with self.get_lock_for_workspace(workspace_id):
            labels = logic.get_labels(workspace_id, dataset_name)
            all_uris = self.get_all_text_elements_uris(dataset_name)
            for uri in uris:
                if uri not in all_uris:
                    raise Exception(f'Trying to unset labels for uri "{uri}" which does not exist')
                labels[uri].pop(category_name)
            # Save updated labels dict to disk
            logic.save_labels_data(dataset_name, workspace_id)

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
        dataset_name = utils.get_dataset_name(texts_and_labels[0][0])
        with self.get_lock_for_workspace(workspace_id):
            ds_labels = logic.get_labels(workspace_id, dataset_name)
            if propagate_to_duplicates:
                clusters, uri_to_rep = logic.load_duplicate_clusters(dataset_name)

            all_uris = self.get_all_text_elements_uris(dataset_name)
            updated_uris = dict()
            for uri, labels in texts_and_labels:
                if uri not in all_uris:
                    raise Exception(f'Trying to set labels for uri "{uri}" which does not exist')

                if propagate_to_duplicates and len(clusters) > 0:  # set the given label for the entire cluster
                    rep_uri = uri if uri_to_rep[uri] == "self" else uri_to_rep[uri]
                    ds_labels[rep_uri].update(labels)
                    for clustered_uri in clusters.get(rep_uri, []):
                        ds_labels[clustered_uri].update(labels)
                    updated_uris[uri] = clusters.get(rep_uri, [])
                else:
                    # Note: we do not override existing labels if they are from another category
                    ds_labels[uri].update(labels)
                    updated_uris[uri] = []
            # Save updated labels dict to disk
            logic.save_labels_data(dataset_name, workspace_id)

        return updated_uris

    def get_documents(self, dataset_name: str, uris: Iterable[str]) -> List[Document]:
        """
        Return a List of Document objects, from the given dataset_name, matching the uris provided.

        :param dataset_name: the name of the dataset from which the documents should be retrieved.
        :param uris: an Iterable of uris of Documents, represented as string.
        :return: a List of Document, from the given dataset_name, matching the uris provided.
        """

        def load_doc(uri):
            filename = utils.uri_to_filename(uri)
            file_path = os.path.join(doc_dump_dir, filename)
            with open(file_path + '.json') as json_file:
                doc_encoded = json_file.read()
            doc = jsonpickle.decode(doc_encoded)
            return doc

        doc_dump_dir = utils.get_documents_dump_dir(dataset_name)
        docs = [load_doc(uri) for uri in uris]
        return docs

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
        docs = self.get_documents(dataset_name, uris)
        with self.get_lock_for_workspace(workspace_id):
            docs = [logic.add_labels_info_for_doc(workspace_id=workspace_id, dataset_name=dataset_name, doc=d)
                    for d in docs]

        return docs

    def get_all_document_uris(self, dataset_name: str) -> List[str]:
        """
        Return a List of all Document uris in the given dataset_name.

        :param dataset_name: the name of the dataset from which the Document uris should be retrieved.
        :return: a List of all Document uris in the given dataset_name.
        """
        uris = []
        doc_dump_dir = utils.get_documents_dump_dir(dataset_name)
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
        return list(logic.get_ds_in_memory(dataset_name)['uri'].values)

    def get_all_text_elements(self, dataset_name: str) -> List[TextElement]:
        """
        Return a List of all TextElement in the given dataset_name.

        :param dataset_name: the name of the dataset from which the TextElement should be retrieved.
        """
        return logic.get_text_elements_from_df_without_labels(logic.get_ds_in_memory(dataset_name))

    def sample_text_elements(self, dataset_name: str, sample_size: int = DEFAULT_SAMPLE_SIZE, query: str = None,
                             remove_duplicates=False, random_state: int = None) -> Mapping:
        """
        Sample *sample_size* TextElements from dataset_name, optionally limiting to those matching a query.

        :param dataset_name: the name of the dataset from which TextElements are sampled
        :param sample_size: how many TextElements should be sampled
        :param query: a regular expression that should be matched in the sampled TextElements. If None, then no such
        filtering is performed.
        :param remove_duplicates: if True, do not include elements that are duplicates of each other.
        :param random_state:
        :return: a dictionary with two keys: 'results' whose value is a list of TextElements, and 'hit_count' whose
        value is the total number of TextElements in the dataset matched by the query.
        {'results': [TextElement], 'hit_count': int}
        """
        results_dict = logic.sample_text_elements(workspace_id=None, dataset_name=dataset_name,
                                                  sample_size=sample_size,
                                                  filter_func=lambda df: logic.filter_by_query(df, query),
                                                  remove_duplicates=remove_duplicates,
                                                  random_state=random_state)
        return results_dict

    def sample_text_elements_with_labels_info(self, workspace_id: str, dataset_name: str,
                                              sample_size: int = DEFAULT_SAMPLE_SIZE,
                                              sample_start_idx: int = 0,
                                              query: str = None,
                                              remove_duplicates=False,
                                              random_state: int = 0) -> Mapping:
        """
        Sample *sample_size* TextElements from dataset_name, optionally limiting to those matching a query,
        and add their labels information for workspace_id, if available.

        :param workspace_id: the workspace_id of the labeling effort.
        :param dataset_name: the name of the dataset from which TextElements are sampled
        :param sample_size: how many TextElements should be sampled
        :param sample_start_idx: get elements starting from this index (for paging) default is 0
        :param query: a regular expression that should be matched in the sampled TextElements. If None, then no such
        filtering is performed.
        :param remove_duplicates: if True, do not include elements that are duplicates of each other.
        :param random_state: provide an int seed to define a random state. Default is zero.
        :return: a dictionary with two keys: 'results' whose value is a list of TextElements, and 'hit_count' whose
        value is the total number of TextElements in the dataset matched by the query.
        {'results': [TextElement], 'hit_count': int}
        """
        with self.get_lock_for_workspace(workspace_id):
            results_dict = logic.sample_text_elements(workspace_id=workspace_id, dataset_name=dataset_name,
                                                      sample_size=sample_size,
                                                      filter_func=lambda df: logic.filter_by_query(df, query),
                                                      sample_start_idx=sample_start_idx,
                                                      remove_duplicates=remove_duplicates,
                                                      random_state=random_state)

        return results_dict

    def sample_unlabeled_text_elements(self, workspace_id: str, dataset_name: str, category_name: str,
                                       sample_size: int = DEFAULT_SAMPLE_SIZE,
                                       sample_start_idx: int = 0, query: str = None,
                                       remove_duplicates=False,
                                       random_state: int = 0) -> Mapping:
        """
        Sample *sample_size* TextElements from dataset_name, unlabeled for category_name in workspace_id, optionally
        limiting to those matching a query.

        :param workspace_id: the workspace_id of the labeling effort.
        :param dataset_name: the name of the dataset from which TextElements are sampled
        :param category_name: the name of the category whose label information are the target of this sample
        :param sample_size: how many TextElements should be sampled
        :param sample_start_idx: get elements starting from this index (for paging) default is 0
        :param query: a regular expression that should be matched in the sampled TextElements. If None, then no such
        filtering is performed.
        :param remove_duplicates: if True, do not include elements that are duplicates of each other.
        :param random_state: provide an int seed to define a random state. Default is zero.
        :return: a dictionary with two keys: 'results' whose value is a list of TextElements, and 'hit_count' whose
        value is the total number of TextElements in the dataset matched by the query.
        {'results': [TextElement], 'hit_count': int}
        """
        filter_func = lambda df: logic.filter_by_query_and_label_status(df, category_name, LabeledStatus.UNLABELED,
                                                                        query)

        with self.get_lock_for_workspace(workspace_id):
            results_dict = logic.sample_text_elements(workspace_id=workspace_id, dataset_name=dataset_name,
                                                      sample_size=sample_size,
                                                      sample_start_idx=sample_start_idx,
                                                      filter_func=filter_func,
                                                      remove_duplicates=remove_duplicates,
                                                      random_state=random_state)
        return results_dict

    def sample_labeled_text_elements(self, workspace_id: str, dataset_name: str, category_name: str,
                                     sample_size: int = DEFAULT_SAMPLE_SIZE, query: str = None,
                                     remove_duplicates=False,
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
        filter_func = lambda df: logic.filter_by_query_and_label_status(df, category_name, LabeledStatus.LABELED, query)
        results_dict = logic.sample_text_elements(workspace_id=workspace_id, dataset_name=dataset_name,
                                                  sample_size=sample_size,
                                                  filter_func=filter_func,
                                                  remove_duplicates=remove_duplicates,
                                                  random_state=random_state)

        return results_dict

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
        labels_by_uri = logic.get_labels(workspace_id=workspace_id, dataset_name=dataset_name)
        if remove_duplicates:
            corpus_df = logic.get_ds_in_memory(dataset_name=dataset_name)
            labeled_df = corpus_df[corpus_df['uri'].isin(labels_by_uri)]
            unique_texts = set()
            uris_to_keep = {t.uri for t in labeled_df.itertuples()
                            if t.text not in unique_texts and not unique_texts.add(t.text)}
            labels_by_uri = {key: value for key, value in labels_by_uri.items() if key in uris_to_keep}
        category_label_list = \
            [labels_by_uri[uri][category_name].labels for uri in labels_by_uri
             if category_name in labels_by_uri[uri]]
        category_label_list = [item for sublist in category_label_list for item in sublist]  # flatten list of sets to a list
        category_label_counts = Counter(category_label_list)
        return category_label_counts

    def copy_labels_to_new_workspace(self, old_worspace_id: str, new_workspace_id: str, dataset_name: str,
                                     dev_dataset_name: str):
        labels_dict_from_old_workspace = logic.get_labels(old_worspace_id, dataset_name)
        labels_list = [(uri, deepcopy(label_dict)) for uri, label_dict in labels_dict_from_old_workspace.items()]
        self.set_labels(new_workspace_id, labels_list)

        if dev_dataset_name is not None:
            labels_dict_from_old_workspace = logic.get_labels(old_worspace_id, dev_dataset_name)
            labels_list = [(uri, deepcopy(label_dict)) for uri, label_dict in labels_dict_from_old_workspace.items()]
            self.set_labels(new_workspace_id, labels_list)

    def clear_saved_labels(self, workspace_id, dataset_name):
        """
        Delete the labels info of the given workspace_id for the given dataset (other labels info files are kept).
        :param workspace_id:
        :param dataset_name:
        """
        labels_file = utils.get_workspace_labels_dump_filename(workspace_id, dataset_name)
        if os.path.isfile(labels_file):
            os.remove(labels_file)
        workspace_dumps_dir = utils.get_workspace_labels_dir(workspace_id)
        if os.path.exists(workspace_dumps_dir) and len(os.listdir(workspace_dumps_dir)) == 0:
            os.rmdir(workspace_dumps_dir)

    def get_text_elements_by_uris(self, dataset_name, uris) -> List[TextElement]:
        return logic.get_text_elements(dataset_name, uris)

    def get_text_elements_with_labels_info(self, workspace_id: str, dataset_name: str, uris: Iterable[str]) -> \
            List[TextElement]:
        """
        Return a List of TextElement objects from the given dataset_name, matching the uris provided, and add the label
        information for the workspace to these TextElements, if available.
        :param workspace_id:
        :param dataset_name:
        :param uris:
        """

        all_elements = logic.get_text_elements(dataset_name, uris)
        with self.get_lock_for_workspace(workspace_id):
            all_elements = logic.add_labels_info_for_text_elements(workspace_id, dataset_name, all_elements)

        return all_elements

    def get_all_datasets(self) -> List[str]:
        path = utils.get_datasets_base_dir()
        return [name for name in os.listdir(path) if os.path.isdir(os.path.join(path, name))]


if __name__ == '__main__':
    import pandas as pd
    da = DataAccessInMemory()
    all_elements = da.get_all_text_elements("cnc_in_plus_out_train")
    all_unique_texts = {x.text for x in all_elements}
    orig_csv_path = '/tmp/multi_train.csv'
    texts = {t for t in pd.read_csv(orig_csv_path)['Sentences']}
    filtered_elements = [x.uri for x in all_elements if x.text in texts]
