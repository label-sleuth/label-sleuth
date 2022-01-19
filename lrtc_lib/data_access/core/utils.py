# (c) Copyright IBM Corporation 2020.

# LICENSE: Apache License 2.0 (Apache-2.0)
# http://www.apache.org/licenses/LICENSE-2.0

import os
import re

from lrtc_lib.definitions import ROOT_DIR

doc_dir_name = 'doc_dump'
sentences_filename = 'dataset_sentences.csv'
labels_filename = 'workspace_labels.json'

URI_SEP = "-"

def get_all_datasets():
    all_datasets = sorted(x for x in os.listdir(get_datasets_base_dir()) if not x.startswith('.'))
    return all_datasets

def get_dataset_base_dir(dataset_name):
    return os.path.join(get_datasets_base_dir(), dataset_name)


def get_datasets_base_dir():
    data_access_dumps_path = os.path.join(ROOT_DIR, 'output', 'data_access_dumps')
    os.makedirs(data_access_dumps_path,exist_ok=True)
    return os.path.join(data_access_dumps_path)


def get_documents_dump_dir(dataset_name):
    return os.path.join(get_dataset_base_dir(dataset_name), doc_dir_name)


def get_dataset_dump_filename(dataset_name):
    return os.path.join(get_dataset_base_dir(dataset_name), sentences_filename)


def get_labels_dump_dir():
    return os.path.join(ROOT_DIR, 'output', 'user_labels')


def get_workspace_labels_dump_filename(workspace_id, dataset_name):
    workspace_dir = get_workspace_labels_dir(workspace_id)
    return os.path.join(workspace_dir, str(dataset_name) + '_' + labels_filename)


def get_workspace_labels_dir(workspace_id):
    return os.path.join(get_labels_dump_dir(), str(workspace_id))


def get_dataset_name(uri):
    uri_split = uri.split(URI_SEP)
    return uri_split[0]


def get_document_uri(uri):
    uri_split = uri.split(URI_SEP)
    return URI_SEP.join(uri_split[:2])


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
