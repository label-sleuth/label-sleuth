import unittest

from lrtc_lib.data_access.core.data_structs import TextElement, Document
from lrtc_lib.data_access.file_based.utils import URI_SEP


def generate_simple_doc(dataset_name, doc_id=0):
    sentences = ['with label true', 'with label false', 'no label']
    text_elements = []
    start_span = 0
    for idx, sentence in enumerate(sentences):
        end_span = start_span + len(sentence)
        text_elements.append(
            TextElement(uri=URI_SEP.join([dataset_name, str(doc_id), str(idx)]), text=sentence,
                        span=[(start_span, end_span)], metadata={}, category_to_label={}))
        start_span = end_span + 1

    doc = Document(uri=dataset_name + URI_SEP + str(doc_id), text_elements=text_elements, metadata={})
    return doc


class TestOrchestratorAPI(unittest.TestCase):
    pass
