import os
import time
from collections import defaultdict

import pandas as pd

from typing import List
from label_sleuth.data_access.core.data_structs import Document, TextElement, DisplayFields, URI_SEP
from label_sleuth.data_access.processors.data_processor_api import DataProcessorAPI


def get_columns(df, column_names):
    column_values = []
    for col_name_to_add in column_names:
        if col_name_to_add is not None:
            if col_name_to_add not in df.columns:
                raise NameError(f'"{col_name_to_add}" is not one of the columns in the given DataFrame: {df.columns}')
            column_values.append(df[col_name_to_add].values)
        else:
            column_values.append([None]*len(df))
    return column_values


class CsvFileProcessor(DataProcessorAPI):
    """
    A DataProcessor for a corpus that is given in a csv format, one TextElement per line.

    """

    def __init__(self, dataset_name: str, temp_file_path: str, text_col: str = DisplayFields.text,
                 metadata_column_name_prefix: str = DisplayFields.csv_metadata_column_prefix,
                 doc_id_col: str = DisplayFields.doc_id, encoding: str = 'utf-8'):
        """

        :param dataset_name: the name of the processed dataset
        :param temp_file_path: the temporary file used to store the csv before processing
        :param text_col: the name of the column which holds the text of the TextElement. Default is 'text'.
        :param metadata_column_name_prefix: prefix of metadata columns that should be saved with the text element
        :param doc_id_col: column name by which text elements should be grouped into docs.
        If None all text elements would be put in a single dummy with the current time the format of '%d_%b_%Y_%H:%M'
         as the doc_id. Default is None.
        :param encoding: the encoding to use to read the csv raw file(s). Default is `utf-8`.

        """
        self.dataset_name = dataset_name
        self.temp_file_path = temp_file_path
        self.text_col = text_col
        self.metadata_column_name_prefix = metadata_column_name_prefix
        self.doc_id_col = doc_id_col
        self.encoding = encoding

    def get_raw_data_path(self) -> str:
        return self.temp_file_path

    def build_documents(self) -> List[Document]:
        """
        Process the raw data into a list of Documents.

        :rtype: List[Document]
        """
        if not os.path.isfile(self.get_raw_data_path()):
            raise Exception(f'file for dataset {self.dataset_name} not found')

        df = pd.read_csv(self.get_raw_data_path(), encoding=self.encoding, na_filter=False)
        df = df[df[self.text_col].apply(lambda x: len(x) > 0)]
        if self.doc_id_col not in df.columns:
            self.doc_id_col = None
        doc_uri_to_text_elements = defaultdict(list)
        metadata_column_names = [col for col in df.columns if col.startswith(self.metadata_column_name_prefix)]
        metadata_dict = {col_name.split(self.metadata_column_name_prefix)[1]: col_values
                         for col_name, col_values in zip(metadata_column_names, get_columns(df, metadata_column_names))}
        for idx, (text, doc_id) in enumerate(zip(*get_columns(df, [self.text_col, self.doc_id_col]))):
            if doc_id is None:
                doc_name_for_uri = time.strftime('%d_%b_%Y_%H-%M-%S', time.gmtime())
            else:
                doc_name_for_uri = str(doc_id).replace(URI_SEP, '_')
            doc_uri = self.dataset_name + URI_SEP + doc_name_for_uri
            if doc_uri not in doc_uri_to_text_elements:
                element_id = 0
                text_span_start = 0
            else:
                prev_element = doc_uri_to_text_elements[doc_uri][-1]
                element_id = int(prev_element.uri.split(URI_SEP)[-1]) + 1
                text_span_start = prev_element.span[0][1] + 1

            text_element_uri = doc_uri + URI_SEP + str(element_id)
            metadata = {k: v[idx] for k, v in metadata_dict.items()}
            text_element = TextElement(uri=text_element_uri, text=text,
                                       span=[(text_span_start, (text_span_start+len(text)))], metadata=metadata,
                                       category_to_label={})
            doc_uri_to_text_elements[doc_uri].append(text_element)

        documents = [Document(uri=doc_uri, text_elements=text_elements, metadata={})
                     for doc_uri, text_elements in doc_uri_to_text_elements.items()]
        return documents
