# (c) Copyright IBM Corporation 2020.

# LICENSE: Apache License 2.0 (Apache-2.0)
# http://www.apache.org/licenses/LICENSE-2.0

import os
import abc
from typing import List, Mapping, Tuple
from lrtc_lib.data_access.core.data_structs import Document, Label
import lrtc_lib.orchestrator.orchestrator_api as orchestrator_api
from lrtc_lib.data_access.processors.dataset_part import DatasetPart
from lrtc_lib.definitions import ROOT_DIR

METADATA_CONTEXT_KEY = 'context'


class DataProcessorAPI(object, metaclass=abc.ABCMeta):
    RAW_DATA_BASE_DIR = os.path.join(ROOT_DIR, 'data', 'available_datasets')

    def __init__(self, dataset_part: DatasetPart):
        self.dataset_part = dataset_part

    @abc.abstractmethod
    def _get_train_file_path(self) -> str:
        """
        Return the full path for the train set.
        """
        func_name = self._get_train_file_path.__name__
        raise NotImplementedError('users must define ' + func_name + ' to use this base class')

    @abc.abstractmethod
    def _get_dev_file_path(self) -> str:
        """
        Return the full path for the dev set.
        """
        return None

    @abc.abstractmethod
    def _get_test_file_path(self) -> str:
        """
       Return the full path for the test set.
       """
        func_name = self._get_test_file_path.__name__
        raise NotImplementedError('users must define ' + func_name + ' to use this base class')

    def get_raw_data_path(self) -> str:
        """
        Return the full path for the given DatasetPart.

        :param dataset_part: the part of the dataset to process (e.g., train/dev/test)
        :return: Return the full path for the given DatasetPart.
        """
        if self.dataset_part == DatasetPart.TRAIN:
            data_path = self._get_train_file_path()
        elif self.dataset_part == DatasetPart.DEV:
            data_path = self._get_dev_file_path()
        elif self.dataset_part == DatasetPart.TEST:
            data_path = self._get_test_file_path()
        return data_path

    def build_documents(self) -> List[Document]:
        """
        Process the raw data into a list of Documents. No labels information is provided.

        :param dataset_part: the part of the dataset to process (e.g., train/dev/test)
        :rtype: List[Document]
        """
        func_name = self.build_documents.__name__
        raise NotImplementedError('users must define ' + func_name + ' to use this base class')

    def get_texts_and_gold_labels(self) -> List[Tuple[str, Mapping[str, Label]]]:
        """
        Process the raw data into gold labels information.

        :param dataset_part: the part of the dataset to process (e.g., train/dev/test)
        :rtype: a list of tuples of uri and a dict. The dict keys are category names and values are Labels.
        For example: [(uri_1, {category_1: Label_cat_1}),
                      (uri_2, {category_1: Label_cat_1,
                               category_2: Label_cat_2})]
        """
        func_name = self.get_texts_and_gold_labels.__name__
        raise NotImplementedError('users must define ' + func_name + ' to use this base class')

