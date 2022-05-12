import unittest
import tempfile
from datetime import datetime

from lrtc_lib.data_access.core.data_structs import TextElement, URI_SEP, Document
from lrtc_lib.models.core.model_api import ModelStatus
from lrtc_lib.models.core.model_types import ModelTypes
from lrtc_lib.orchestrator.core.state_api.orchestrator_state_api import OrchestratorStateApi, ModelInfo, IterationStatus


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

    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.orchestrator_state_api = OrchestratorStateApi(self.temp_dir.name)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_delete_category_from_workspace(self):
        workspace_id = "workspace_1"

        dataset_name = 'non_existing_dump'

        self.orchestrator_state_api.create_workspace(workspace_id=workspace_id, dataset_name=dataset_name)
        self.orchestrator_state_api.add_category_to_workspace(workspace_id,"category_1","category 1 description")
        self.orchestrator_state_api.add_category_to_workspace(workspace_id,"category_2","category 2 description")
        self.orchestrator_state_api.add_iteration(workspace_id,"category_2",ModelInfo("123",ModelStatus.READY,datetime.now(),ModelTypes.SVM_OVER_GLOVE,{}))
        self.orchestrator_state_api.add_category_to_workspace(workspace_id,"category_3","category 3 description")

        categories = self.orchestrator_state_api.get_workspace(workspace_id).categories.keys()
        self.assertEqual({"category_1","category_2","category_3"},categories)
        categories = self.orchestrator_state_api.get_workspace(workspace_id).categories.keys()
        self.orchestrator_state_api.delete_category_from_workspace(workspace_id, "category_2")
        self.assertEqual({"category_1", "category_3"}, categories)


    def test_get_all_workspaces(self):
        dataset_name = 'non_existing_dump'
        self.orchestrator_state_api.create_workspace(workspace_id="workspace_1", dataset_name=dataset_name)
        self.orchestrator_state_api.create_workspace(workspace_id="workspace_2", dataset_name=dataset_name)
        self.assertEqual({"workspace_1","workspace_2"},{ws.workspace_id for ws in self.orchestrator_state_api.get_all_workspaces()})

    def test_delete_workspace(self):
        dataset_name = 'non_existing_dump'
        self.orchestrator_state_api.create_workspace(workspace_id="workspace_1", dataset_name=dataset_name)
        self.orchestrator_state_api.create_workspace(workspace_id="workspace_2", dataset_name=dataset_name)
        self.orchestrator_state_api.delete_workspace_state("workspace_1") #TODO rename
        self.assertEqual({"workspace_2"},{ws.workspace_id for ws in self.orchestrator_state_api.get_all_workspaces()})

    def test_workspace_exists(self):
        dataset_name = 'non_existing_dump'
        self.orchestrator_state_api.create_workspace(workspace_id="workspace_1", dataset_name=dataset_name)
        self.assertTrue(self.orchestrator_state_api.workspace_exists("workspace_1"))

    def test_add_iteration(self):
        dataset_name = 'non_existing_dump'
        workspace_id = "workspace_1"
        self.orchestrator_state_api.create_workspace(workspace_id=workspace_id, dataset_name=dataset_name)
        self.orchestrator_state_api.add_category_to_workspace(workspace_id, "category_1", "category 1 description")
        self.orchestrator_state_api.add_category_to_workspace(workspace_id, "category_2", "category 2 description")
        self.orchestrator_state_api.add_iteration(workspace_id, "category_2",
                                                  ModelInfo("123", ModelStatus.READY, datetime.now(),
                                                            ModelTypes.SVM_OVER_GLOVE, {}))
        self.assertEqual(1,len(self.orchestrator_state_api.get_all_iterations(workspace_id,"category_2")))

    def test_get_and_update_iteration_status(self):
        dataset_name = 'non_existing_dump'
        workspace_id = "workspace_1"
        self.orchestrator_state_api.create_workspace(workspace_id=workspace_id, dataset_name=dataset_name)
        self.orchestrator_state_api.add_category_to_workspace(workspace_id, "category_1", "category 1 description")
        self.orchestrator_state_api.add_category_to_workspace(workspace_id, "category_2", "category 2 description")
        self.orchestrator_state_api.add_iteration(workspace_id, "category_2",
                                                  ModelInfo("123", ModelStatus.READY, datetime.now(),
                                                            ModelTypes.SVM_OVER_GLOVE, {}))
        self.orchestrator_state_api.add_iteration(workspace_id, "category_2",
                                                  ModelInfo("456", ModelStatus.TRAINING, datetime.now(),
                                                            ModelTypes.SVM_OVER_GLOVE, {}))

        self.assertEqual(IterationStatus.TRAINING,
                         self.orchestrator_state_api.get_iteration_status(workspace_id, "category_2", 0))
        self.assertEqual(IterationStatus.TRAINING,
                         self.orchestrator_state_api.get_iteration_status(workspace_id,"category_2",1))
        self.orchestrator_state_api.update_iteration_status(workspace_id,"category_2",0,IterationStatus.READY)
        self.assertEqual(IterationStatus.READY,
                         self.orchestrator_state_api.get_iteration_status(workspace_id, "category_2", 0))
        self.orchestrator_state_api.update_iteration_status(workspace_id, "category_2", 1, IterationStatus.READY)
        self.assertEqual(IterationStatus.READY,
                         self.orchestrator_state_api.get_iteration_status(workspace_id, "category_2", 1))


    def test_get_and_update_model_status(self):
        dataset_name = 'non_existing_dump'
        workspace_id = "workspace_1"
        self.orchestrator_state_api.create_workspace(workspace_id=workspace_id, dataset_name=dataset_name)
        self.orchestrator_state_api.add_category_to_workspace(workspace_id, "category_1", "category 1 description")
        self.orchestrator_state_api.add_category_to_workspace(workspace_id, "category_2", "category 2 description")
        self.orchestrator_state_api.add_iteration(workspace_id, "category_2",
                                                  ModelInfo("123", ModelStatus.READY, datetime.now(),
                                                            ModelTypes.SVM_OVER_GLOVE, {}))
        self.orchestrator_state_api.add_iteration(workspace_id, "category_2",
                                                  ModelInfo("456", ModelStatus.TRAINING, datetime.now(),
                                                            ModelTypes.SVM_OVER_GLOVE, {}))
        self.assertEqual(ModelStatus.TRAINING,
                         self.orchestrator_state_api.get_all_iterations(workspace_id,"category_2")[1].model.model_status)
        self.orchestrator_state_api.update_model_status(workspace_id,"category_2",1,ModelStatus.READY)
        self.assertEqual(ModelStatus.READY,
                         self.orchestrator_state_api.get_all_iterations(workspace_id,"category_2")[1].model.model_status)
