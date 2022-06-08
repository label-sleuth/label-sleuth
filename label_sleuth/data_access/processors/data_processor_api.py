import abc
from typing import List
from label_sleuth.data_access.core.data_structs import Document


class DataProcessorAPI(object, metaclass=abc.ABCMeta):

    def get_raw_data_path(self) -> str:
        """
        Return the full path for the given dataset file.
        """
        raise NotImplementedError(f'users must define {self.get_raw_data_path.__name__} to use this base class')

    def build_documents(self) -> List[Document]:
        """
        Process the raw data into a list of Documents.

        :rtype: List[Document]
        """
        raise NotImplementedError(f'users must define {self.build_documents.__name__} to use this base class')
