import unittest

from lrtc_lib.data_access.core.data_structs import Label, LABEL_NEGATIVE, TextElement, URI_SEP, Document
from lrtc_lib.factories import DATA_ACCESS as data_access
from lrtc_lib.orchestrator import orchestrator_api
from lrtc_lib.orchestrator.core.state_api import orchestrator_state_api
from lrtc_lib.models.core.model_api import ModelStatus
from lrtc_lib.models.core.model_types import ModelTypes



def generate_simple_doc(dataset_name,num_sentences, doc_id=0):
    sentence_template = 'This is sentence number :{}'
    sentences = []
    for id in range(num_sentences):
        sentences.append(sentence_template.format(id))

    text_elements = []
    start_span = 0
    for idx, sentence in enumerate(sentences):
        end_span = start_span + len(sentence)

        text_elements.append(TextElement(uri=URI_SEP.join([dataset_name, str(doc_id), str(idx)]), text=sentence,
                                         span=[(start_span, end_span)], metadata={},category_to_label={}))
        start_span = end_span + 1

    doc = Document(uri=dataset_name + URI_SEP + str(doc_id), text_elements=text_elements, metadata={})
    return doc

class TestOrchestratorStateAPI(unittest.TestCase):



    def test_set_train_param(self):

        ws_id = self.test_set_train_param.__name__ + '_workspace'
        dataset_name = ws_id + '_dump'
        data_access.add_documents(dataset_name, [generate_simple_doc(dataset_name,num_sentences=10)])
        orchestrator_state_api.create_workspace(workspace_id=ws_id, dataset_name=dataset_name)

        orchestrator_state_api.delete_workspace_state(ws_id)
        data_access.delete_dataset(dataset_name)

    def test_delete_category_from_workspace(self):
        ws_id = self.test_delete_category_from_workspace.__name__ + '_workspace'

        dataset_name = ws_id + '_dump'
        data_access.add_documents(dataset_name, [generate_simple_doc(dataset_name,num_sentences=10)])
        orchestrator_state_api.create_workspace(workspace_id=ws_id, dataset_name=dataset_name)
        orchestrator_state_api.add_category_to_workspace(ws_id,"cat1","bla bla")
        orchestrator_state_api.add_category_to_workspace(ws_id, "cat2", "bla bla")
        orchestrator_state_api.add_category_to_workspace(ws_id, "cat3", "bla bla")
        orchestrator_state_api.delete_category_from_workspace(ws_id,"cat2")
        ws = orchestrator_state_api.get_workspace(ws_id)

        orchestrator_state_api.delete_workspace_state(ws_id)
        data_access.delete_dataset(dataset_name)
        # TODO assert that category doesn't exist anymore in workspace

