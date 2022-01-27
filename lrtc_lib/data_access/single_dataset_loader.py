import os

import shutil
from typing import List

import lrtc_lib.data_access.core.utils as utils
import lrtc_lib.data_access.core.data_access_in_memory_logic as logic
import lrtc_lib.data_access.data_access_factory as data_access_factory
from lrtc_lib.data_access.core.data_structs import Document
from lrtc_lib.data_access.processors.data_processor_api import DataProcessorAPI
from lrtc_lib.data_access.processors.dataset_part import DatasetPart
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s')


def load_dataset_using_processor(dataset_name: str, force_new, data_processor: DataProcessorAPI) -> List[Document]:
    """
    Load the Documents of the given dataset.
    :param dataset_name:
    :param force_new: default is False.
    :return:
    """

    docs_dir = utils.get_documents_dump_dir(dataset_name)

    data_access = data_access_factory.get_data_access()
    docs_from_preprocessor = data_processor.build_documents()
    data_access.add_documents(dataset_name=dataset_name, documents=docs_from_preprocessor)
    num_of_text_elements = sum([len(doc.text_elements) for doc in docs_from_preprocessor])
    logging.info(f'{dataset_name}:\t\tloaded {len(docs_from_preprocessor)} documents '
                 f'({num_of_text_elements} text elements) under {docs_dir}')
    return docs_from_preprocessor

def clear_all_saved_files(dataset_name):
    """
    Delete all cache files saved under the dataset dir (including documents dump, the dataset sentences, and labels
    info for all workspace_ids).
    :param dataset_name:
    """
    dataset_dir = utils.get_dataset_base_dir(dataset_name)
    if os.path.isdir(dataset_dir):
        shutil.rmtree(dataset_dir)
    if dataset_name in logic.ds_in_memory:
        del logic.ds_in_memory[dataset_name]

