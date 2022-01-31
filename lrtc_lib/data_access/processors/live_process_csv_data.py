import os
from collections import defaultdict

import pandas as pd

from typing import List
from lrtc_lib.data_access.core.data_structs import Document, TextElement
from lrtc_lib.data_access.processors.data_processor_api import DataProcessorAPI, METADATA_CONTEXT_KEY
from lrtc_lib.data_access.core.utils import URI_SEP
from lrtc_lib.definitions import ROOT_DIR


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


class LiveCsvProcessor(DataProcessorAPI):
    """
    A DataProcessor for a corpus that is given in a csv format, one TextElement per line.

    """

    def __init__(self, dataset_name: str, temp_file_name: str, text_col: str = 'text',
                 context_col: str = None, context_col_label: str = METADATA_CONTEXT_KEY,
                 doc_id_col: str = 'document_id', encoding: str = 'utf-8'):
        """

        :param dataset_name: the name of the processed dataset
        :param temp_file_name: the temporary file used to store the csv before processing
        :param text_col: the name of the column which holds the text of the TextElement. Default is 'text'.
        :param context_col: the name of the column which provides context for the text, None if no context is available.
        Default is None.
        :param doc_id_col: column name by which text elements should be grouped into docs.
        If None all text elements would be put in a single dummy doc. Default is None.
        :param encoding: the encoding to use to read the csv raw file(s). Default is `utf-8`.

        """
        self.dataset_name = dataset_name
        self.temp_file_name = temp_file_name
        self.text_col = text_col
        self.context_col = context_col
        self.context_col_label = context_col_label
        self.doc_id_col = doc_id_col
        self.encoding = encoding

    def get_raw_data_path(self) -> str:
        return os.path.join(ROOT_DIR, "output", "temp", "csv_upload", self.temp_file_name)

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
        for idx, (text, context, doc_id) in enumerate(zip(
                *get_columns(df, [self.text_col, self.context_col, self.doc_id_col]))):

            doc_name_for_uri = '0' if doc_id is None else str(doc_id).replace(URI_SEP, '_')
            doc_uri = self.dataset_name + URI_SEP + doc_name_for_uri
            if doc_uri not in doc_uri_to_text_elements:
                element_id = 0
                text_span_start = 0
            else:
                prev_element = doc_uri_to_text_elements[doc_uri][-1]
                element_id = int(prev_element.uri.split(URI_SEP)[-1]) + 1
                text_span_start = prev_element.span[0][1] + 1

            text_element_uri = doc_uri + URI_SEP + str(element_id)
            metadata = {self.context_col_label: context} if context else {}
            text_element = TextElement(uri=text_element_uri, text=text,
                                       span=[(text_span_start, (text_span_start+len(text)))], metadata=metadata,
                                       category_to_label={})
            doc_uri_to_text_elements[doc_uri].append(text_element)

        documents = [Document(uri=doc_uri, text_elements=text_elements, metadata={})
                     for doc_uri, text_elements in doc_uri_to_text_elements.items()]
        return documents
