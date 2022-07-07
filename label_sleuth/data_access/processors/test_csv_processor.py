import os
import tempfile
import unittest
import pandas as pd

from label_sleuth.data_access.processors.csv_processor import CsvFileProcessor


class TestCsvFileProcessor(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.TemporaryDirectory()

    @classmethod
    def tearDownClass(cls):
        cls.temp_dir.cleanup()

    def test_csv_processor_with_document_id(self):
        workspace_id = self.test_csv_processor_with_document_id.__name__
        dataset_name = f'{workspace_id}_dump'
        data = [{"document_id": 0, "text": "first sentence in document 0"},
                {"document_id": 0, "text": "second sentence in document 0"},
                {"document_id": 1, "text": "first sentence in document 1"},
                {"document_id": 2, "text": "first sentence in document 2", "metadata_text_subject": "no subject"},
                {"document_id": 2, "text": "second sentence in document 2"},
                {"document_id": 2, "text": "third sentence in document 2"}]
        df = pd.DataFrame(data)
        file_path = os.path.join(TestCsvFileProcessor.temp_dir.name, "dataset_name.csv")
        df.to_csv(file_path)
        processor = CsvFileProcessor(dataset_name, file_path)
        documents = processor.build_documents()
        self.assertEqual(3, len(documents))

        # assert URIs are equal
        for sentence in data:
            self.assertEqual(f"{dataset_name}-{sentence['document_id']}", documents[sentence['document_id']].uri)

        # assert text is equal
        all_texts_from_documents = [text_element for document in documents for text_element in document.text_elements]
        for expected_dict, text_element in zip(data, all_texts_from_documents):
            self.assertEqual(expected_dict["text"], text_element.text)

        # assert metadata is equal
        self.assertEqual({"text_subject": "no subject"}, documents[2].text_elements[0].metadata)

    def test_csv_processor_without_document_id(self):
        workspace_id = self.test_csv_processor_without_document_id.__name__
        dataset_name = f'{workspace_id}_dump'
        data = [{"text": "1st sentence"},
                {"text": "2nd sentence"},
                {"text": "3rd sentence"},
                {"text": "4th sentence"},
                {"text": "5th sentence"},
                {"text": "6th sentence"},
                {"text": "7th sentence"},
                {"text": "8th sentence"},
                {"text": "9th sentence"},
                {"text": "10th sentence"},
                {"text": "11th sentence"}]
        df = pd.DataFrame(data)
        file_path = os.path.join(TestCsvFileProcessor.temp_dir.name, "dataset_name.csv")
        df.to_csv(file_path)
        processor = CsvFileProcessor(dataset_name, file_path)
        documents = processor.build_documents()
        self.assertEqual(1, len(documents))

        # assert text is equal
        all_texts_from_documents = documents[0].text_elements
        for expected_dict, text_element in zip(data, all_texts_from_documents):
            self.assertTrue(text_element.uri.startswith(dataset_name))
            self.assertEqual(expected_dict["text"], text_element.text)
