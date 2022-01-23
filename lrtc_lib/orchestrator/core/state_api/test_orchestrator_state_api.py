import unittest

from lrtc_lib.data_access import single_dataset_loader
from lrtc_lib.orchestrator import orchestrator_api
from lrtc_lib.orchestrator.core.state_api import orchestrator_state_api
from lrtc_lib.orchestrator.orchestrator_api import BINARY_LABELS
from lrtc_lib.orchestrator.test_orchestrator_api import generate_simple_doc
from lrtc_lib.models.core.model_api import ModelStatus
from lrtc_lib.models.core.model_types import ModelTypes


class TestOrchestratorStateAPI(unittest.TestCase):

    def test_copy_workspace(self):
        ws_id = self.test_copy_workspace.__name__ + '_workspace'
        dataset_name = self.test_copy_workspace.__name__ + '_dump'
        cat_name = "cat1"
        cat_desc = "cat_desc"
        model_id = "1"
        orchestrator_api.add_documents(dataset_name, [generate_simple_doc(dataset_name)])
        orchestrator_state_api.create_workspace(workspace_id=ws_id, dataset_name=dataset_name)
        orchestrator_state_api.add_category_to_workspace(ws_id, cat_name, cat_desc, BINARY_LABELS)
        orchestrator_state_api.add_model(workspace_id=ws_id, category_name=cat_name, model_id=model_id,
                                         model_status=ModelStatus.READY, model_type=ModelTypes.RAND,
                                         model_metadata={})
        new_ws_id = "new_" + ws_id
        orchestrator_state_api.copy_workspace(ws_id, new_ws_id)
        old_ws = orchestrator_state_api.get_workspace(new_ws_id)
        new_ws = orchestrator_state_api.get_workspace(new_ws_id)
        self.assertEqual(new_ws.workspace_id, new_ws_id)
        self.assertEqual(old_ws.dataset_name, new_ws.dataset_name)
        self.assertEqual(old_ws.category_to_description, new_ws.category_to_description)
        self.assertEqual(old_ws.category_to_model_to_recommendations, new_ws.category_to_model_to_recommendations)
        self.assertEqual(old_ws.category_to_models, new_ws.category_to_models)

        orchestrator_state_api.delete_workspace_state(ws_id)
        orchestrator_state_api.delete_workspace_state(new_ws_id)
        single_dataset_loader.clear_all_saved_files(dataset_name)

    def test_set_train_param(self):

        ws_id = self.test_set_train_param.__name__ + '_workspace'
        dataset_name = "None"
        orchestrator_api.add_documents(dataset_name, [generate_simple_doc(dataset_name)])
        orchestrator_state_api.create_workspace(workspace_id=ws_id, dataset_name=dataset_name)
        orchestrator_state_api.add_train_param(ws_id, "key", "value")
        self.assertEqual(orchestrator_state_api.get_workspace(ws_id).train_params["key"], "value")

        orchestrator_state_api.delete_workspace_state(ws_id)
        single_dataset_loader.clear_all_saved_files(dataset_name)

    def test_delete_category_from_workspace(self):
        ws_id = self.test_delete_category_from_workspace.__name__ + '_workspace'

        dataset_name = "None"
        orchestrator_api.add_documents(dataset_name, [generate_simple_doc(dataset_name)])
        orchestrator_state_api.create_workspace(workspace_id=ws_id, dataset_name=dataset_name)
        orchestrator_state_api.add_category_to_workspace(ws_id,"cat1","bla bla",[True,False])
        orchestrator_state_api.add_category_to_workspace(ws_id, "cat2", "bla bla", [True, False])
        orchestrator_state_api.add_category_to_workspace(ws_id, "cat3", "bla bla", [True, False])
        orchestrator_state_api.delete_category_from_workspace(ws_id,"cat2")
        ws = orchestrator_state_api.get_workspace(ws_id)
        self.assertEqual(len(ws.category_to_labels),2)

        orchestrator_state_api.delete_workspace_state(ws_id)
        single_dataset_loader.clear_all_saved_files(dataset_name)

