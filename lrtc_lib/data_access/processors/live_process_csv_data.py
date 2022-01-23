import ast
import logging
import os
from collections import defaultdict

import pandas as pd

from typing import List, Mapping, Tuple
from lrtc_lib.data_access.core.data_structs import Document, TextElement, Label
from lrtc_lib.data_access.processors.data_processor_api import DataProcessorAPI, METADATA_CONTEXT_KEY
from lrtc_lib.data_access.processors.dataset_part import DatasetPart
from lrtc_lib.data_access.core.utils import URI_SEP
from lrtc_lib.definitions import ROOT_DIR


def get_columns(df, column_names):
    column_values = []
    for col_name_to_add in column_names:
        if col_name_to_add:
            if col_name_to_add not in df.columns:
                raise NameError(f'"{col_name_to_add}" is not one of the columns in the given DataFrame: {df.columns}')
            column_values.append(df[col_name_to_add].values)
        else:
            column_values.append([None]*len(df))
    return column_values


class LiveCsvProcessor(DataProcessorAPI):
    """
    A DataProcessor for corpus that is given in a csv format, one TextElement per line.

    """

    def __init__(self, dataset_name: str, temp_file_name: str, text_col: str = 'text',
                 label_col: str = 'label', context_col: str = None, context_col_label: str = METADATA_CONTEXT_KEY,
                 doc_id_col: str = 'document_id',
                 encoding: str = 'utf-8'):
        """

        :param dataset_name: the name of the processed dataset
        :param dataset_part: the part - train/dev/test - of the dataset
        :param text_col: the name of the column which holds the text of the TextElement. Default is 'text'.
        :param label_col: the name of the column which holds the label. Default is 'label'.
        :param context_col: the name of the column which provides context for the text, None if no context is available.
        Default is None.
        :param doc_id_col: column name by which text elements should be grouped into docs.
        If None all text elements would be put in a single dummy doc. Default is None.
        :param encoding: the encoding to use to read the csv raw file(s). Default is `utf-8`.

        """
        super().__init__(None)
        self.documents = []
        self.uri_category_labels = []
        self.dataset_name = dataset_name
        self.temp_file_name = temp_file_name
        self.text_col = text_col
        self.label_col = label_col
        self.context_col = context_col
        self.context_col_label = context_col_label
        self.doc_id_col = doc_id_col
        self.encoding = encoding
        self._process()

    def build_documents(self) -> List[Document]:
        """
        Process the raw data into a list of Documents. No labels information is provided.

        :rtype: List[Document]
        """
        return self.documents

    def get_texts_and_gold_labels(self) -> List[Tuple[str, Mapping[str, Label]]]:
        """
        Process the raw data into gold labels information.

        :rtype: a list of tuples of uri and a dict. The dict keys are category names and values are Labels.
        For example: [(uri_1, {category_1: Label_cat_1}),
                      (uri_2, {category_1: Label_cat_1,
                               category_2: Label_cat_2})]
        """
        return self.uri_category_labels

    def _get_train_file_path(self) -> str:
        return os.path.join(ROOT_DIR, "output", "temp", "csv_upload", self.temp_file_name)

    def _get_dev_file_path(self) -> str:
        raise Exception("no dev in upload")

    def _get_test_file_path(self) -> str:
        raise Exception("no test in upload")

    def get_raw_data_path(self) -> str:
        return self._get_train_file_path()

    def _process(self):
        if not os.path.isfile(self.get_raw_data_path()):
            raise Exception(f'file for dataset "{self.dataset_name}" not found')

        df = pd.read_csv(self.get_raw_data_path(), encoding=self.encoding, na_filter=False)
        df = df[df[self.text_col].apply(lambda x: len(x) > 0)]
        if self.doc_id_col not in df.columns:
            self.doc_id_col = None
        if self.label_col not in df.columns:
            df[self.label_col] = None
        uri_to_category_labels = []
        prev_doc_id = None
        element_id = -1
        text_span_start = 0
        doc_uri_to_text_elements = defaultdict(list)
        for idx, (text, label, context, doc_id) in enumerate(zip(
                *get_columns(df, [self.text_col, self.label_col, self.context_col, self.doc_id_col]))):
            if prev_doc_id is not None and prev_doc_id != doc_id:
                element_id = -1
                text_span_start = 0

            doc_name_for_uri = '0' if doc_id is None else str(doc_id).replace(URI_SEP, '_')
            doc_uri = self.dataset_name + URI_SEP + doc_name_for_uri
            element_id += 1
            text_element_uri = doc_uri + URI_SEP + str(element_id)
            metadata = {self.context_col_label: context} if context else {}
            text_element = TextElement(uri=text_element_uri, text=text,
                                       span=[(text_span_start, (text_span_start+len(text)))], metadata=metadata,
                                       category_to_label={})
            doc_uri_to_text_elements[doc_uri].append(text_element)

            category_to_label_dict = {}
            uri_to_category_labels.append((text_element_uri, category_to_label_dict))
            prev_doc_id = doc_id
            text_span_start += (len(text) + 1)

        self.documents = [Document(uri=doc_uri, text_elements=text_elements, metadata={})
                          for doc_uri, text_elements in doc_uri_to_text_elements.items()]
        self.uri_category_labels = uri_to_category_labels
