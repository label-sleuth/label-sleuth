#
#  Copyright (c) 2022 IBM Corp.
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#  http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#

import os
import unittest
import shutil
import tempfile
from datetime import datetime

from label_sleuth.data_access.core.data_structs import TextElement, URI_SEP, Document
from label_sleuth.models.core.model_api import ModelStatus
from label_sleuth.models.core.catalog import ModelsCatalog
from label_sleuth.orchestrator.core.state_api.orchestrator_state_api import OrchestratorStateApi, ModelInfo, \
    IterationStatus, Iteration, Category, Workspace


def generate_simple_doc(dataset_name, num_sentences, doc_id=0):
    sentence_template = 'This is sentence number :{}'
    sentences = [sentence_template.format(idx) for idx in range(num_sentences)]

    text_elements = []
    start_span = 0
    for idx, sentence in enumerate(sentences):
        end_span = start_span + len(sentence)

        text_elements.append(TextElement(uri=URI_SEP.join([dataset_name, str(doc_id), str(idx)]), text=sentence,
                                         span=[(start_span, end_span)], metadata={}, category_to_label={}))
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
        category1_id = self.orchestrator_state_api.add_category_to_workspace(workspace_id, "category_1", "category 1 description")
        category2_id = self.orchestrator_state_api.add_category_to_workspace(workspace_id, "category_2", "category 2 description")
        self.orchestrator_state_api.add_iteration(workspace_id, category2_id)
        self.orchestrator_state_api.add_model(workspace_id, category2_id, 0,
                                              ModelInfo("123", ModelStatus.READY, datetime.now(),
                                                        ModelsCatalog.SVM_OVER_WORD_EMBEDDINGS, {}))
        category3_id = self.orchestrator_state_api.add_category_to_workspace(workspace_id, "category_3", "category 3 description")

        category_ids = self.orchestrator_state_api.get_all_categories(workspace_id).keys()
        self.assertEqual({category1_id, category2_id, category3_id}, category_ids)
        self.orchestrator_state_api.delete_category_from_workspace(workspace_id, category2_id)
        category_ids = self.orchestrator_state_api.get_all_categories(workspace_id).keys()
        self.assertEqual({category1_id, category3_id}, category_ids)

    def test_get_all_workspaces(self):
        dataset_name = 'non_existing_dump'
        self.orchestrator_state_api.create_workspace(workspace_id="workspace_1", dataset_name=dataset_name)
        self.orchestrator_state_api.create_workspace(workspace_id="workspace_2", dataset_name=dataset_name)
        self.assertEqual({"workspace_1", "workspace_2"},
                         {ws.workspace_id for ws in self.orchestrator_state_api.get_all_workspaces()})

    def test_delete_workspace(self):
        dataset_name = 'non_existing_dump'
        self.orchestrator_state_api.create_workspace(workspace_id="workspace_1", dataset_name=dataset_name)
        self.orchestrator_state_api.create_workspace(workspace_id="workspace_2", dataset_name=dataset_name)
        self.orchestrator_state_api.delete_workspace_state("workspace_1")  # TODO rename
        self.assertEqual({"workspace_2"},
                         {ws.workspace_id for ws in self.orchestrator_state_api.get_all_workspaces()})

    def test_workspace_exists(self):
        dataset_name = 'non_existing_dump'
        self.orchestrator_state_api.create_workspace(workspace_id="workspace_1", dataset_name=dataset_name)
        self.assertTrue(self.orchestrator_state_api.workspace_exists("workspace_1"))

    def test_add_iteration(self):
        dataset_name = 'non_existing_dump'
        workspace_id = "workspace_1"
        self.orchestrator_state_api.create_workspace(workspace_id=workspace_id, dataset_name=dataset_name)
        category1_id = self.orchestrator_state_api.add_category_to_workspace(workspace_id, "category_1", "category 1 description")
        category2_id = self.orchestrator_state_api.add_category_to_workspace(workspace_id, "category_2", "category 2 description")
        self.orchestrator_state_api.add_iteration(workspace_id, category2_id)
        self.orchestrator_state_api.add_model(workspace_id, category2_id, 0,
                                              ModelInfo("123", ModelStatus.READY, datetime.now(),
                                                        ModelsCatalog.SVM_OVER_WORD_EMBEDDINGS, {}))
        self.assertEqual(1, len(self.orchestrator_state_api.get_all_iterations(workspace_id, category2_id)))

    def test_get_and_update_iteration_status(self):
        dataset_name = 'non_existing_dump'
        workspace_id = "workspace_1"
        self.orchestrator_state_api.create_workspace(workspace_id=workspace_id, dataset_name=dataset_name)
        category1_id = self.orchestrator_state_api.add_category_to_workspace(workspace_id, "category_1", "category 1 description")
        category2_id = self.orchestrator_state_api.add_category_to_workspace(workspace_id, "category_2", "category 2 description")
        self.orchestrator_state_api.add_iteration(workspace_id, category2_id)
        self.orchestrator_state_api.add_model(workspace_id, category2_id, 0,
                                              ModelInfo("123", ModelStatus.READY, datetime.now(),
                                                        ModelsCatalog.SVM_OVER_WORD_EMBEDDINGS, {}))
        self.orchestrator_state_api.add_iteration(workspace_id, category2_id)
        self.orchestrator_state_api.add_model(workspace_id, category2_id, 1,
                                              ModelInfo("456", ModelStatus.TRAINING, datetime.now(),
                                                        ModelsCatalog.SVM_OVER_WORD_EMBEDDINGS, {}))

        self.assertEqual(IterationStatus.PREPARING_DATA,
                         self.orchestrator_state_api.get_iteration_status(workspace_id, category2_id, 0))
        self.assertEqual(IterationStatus.PREPARING_DATA,
                         self.orchestrator_state_api.get_iteration_status(workspace_id, category2_id, 1))
        self.orchestrator_state_api.update_iteration_status(workspace_id, category2_id, 0, IterationStatus.READY)
        self.assertEqual(IterationStatus.READY,
                         self.orchestrator_state_api.get_iteration_status(workspace_id, category2_id, 0))
        self.orchestrator_state_api.update_iteration_status(workspace_id, category2_id, 1, IterationStatus.READY)
        self.assertEqual(IterationStatus.READY,
                         self.orchestrator_state_api.get_iteration_status(workspace_id, category2_id, 1))

    def test_get_and_update_model_status(self):
        dataset_name = 'non_existing_dump'
        workspace_id = "workspace_1"
        self.orchestrator_state_api.create_workspace(workspace_id=workspace_id, dataset_name=dataset_name)
        self.orchestrator_state_api.add_category_to_workspace(workspace_id, "category_1", "category 1 description")
        category2_id = self.orchestrator_state_api.add_category_to_workspace(workspace_id, "category_2", "category 2 description")
        self.orchestrator_state_api.add_iteration(workspace_id, category2_id)
        self.orchestrator_state_api.add_model(workspace_id, category2_id, 0,
                                              ModelInfo("123", ModelStatus.READY, datetime.now(),
                                                        ModelsCatalog.SVM_OVER_WORD_EMBEDDINGS, {}))
        self.orchestrator_state_api.add_iteration(workspace_id, category2_id)
        self.orchestrator_state_api.add_model(workspace_id, category2_id, 1,
                                              ModelInfo("456", ModelStatus.TRAINING, datetime.now(),
                                                        ModelsCatalog.SVM_OVER_WORD_EMBEDDINGS, {}))
        self.assertEqual(ModelStatus.TRAINING, self.orchestrator_state_api.get_all_iterations(
            workspace_id, category2_id)[1].model.model_status)
        self.orchestrator_state_api.update_model_status(workspace_id, category2_id, 1, ModelStatus.READY)
        self.assertEqual(ModelStatus.READY, self.orchestrator_state_api.get_all_iterations(
            workspace_id, category2_id)[1].model.model_status)

    def test_write_and_read_workspace(self):
        dataset_name = 'non_existing_dump'
        workspace_id = "workspace_1"
        self.orchestrator_state_api.create_workspace(workspace_id=workspace_id, dataset_name=dataset_name)
        self.orchestrator_state_api.add_category_to_workspace(workspace_id, "category_1", "category 1 description")
        category2_id = self.orchestrator_state_api.add_category_to_workspace(workspace_id, "category_2", "category 2 description")
        self.orchestrator_state_api.add_iteration(workspace_id, category2_id)
        self.orchestrator_state_api.add_model(workspace_id, category2_id, 0,
                                              ModelInfo("123", ModelStatus.READY, datetime.now(),
                                                        ModelsCatalog.SVM_OVER_WORD_EMBEDDINGS, {}))
        self.orchestrator_state_api.add_iteration(workspace_id, category2_id)
        self.orchestrator_state_api.add_model(workspace_id, category2_id, 1,
                                              ModelInfo("456", ModelStatus.TRAINING, datetime.now(),
                                                        ModelsCatalog.SVM_OVER_WORD_EMBEDDINGS, {}))
        workspace = self.orchestrator_state_api.get_workspace(workspace_id)
        # clear workspace cache
        self.orchestrator_state_api.workspaces = {}
        workspace_from_disk = self.orchestrator_state_api.get_workspace(workspace_id)
        self.assertEqual(workspace, workspace_from_disk,
                         msg='Workspace loaded from disk does not match original workspace')

    def test_load_existing_workspace(self):
        """
        Make sure that code changes do not break existing workspaces
        """
        sample_workspace = os.path.abspath(os.path.join(__file__, os.pardir, 'test_workspace.json'))
        shutil.copyfile(sample_workspace, os.path.join(self.temp_dir.name, os.path.basename(sample_workspace)))

        try:
            ws = self.orchestrator_state_api.get_workspace('test_workspace')
        except Exception:
            raise Exception("Failed to load the example workspace. This probably means that your code changes break "
                            "existing workspace files.")

        self.assertEqual(ws.__dict__.keys(), Workspace.__annotations__.keys(),
                         "Workspace fields have changed, this may break existing user files")
        for cat_name, cat in ws.categories.items():
            self.assertEqual(cat.__dict__.keys(), Category.__annotations__.keys(),
                             "Category fields have changed, this may break existing user files")
            for iteration in cat.iterations:
                self.assertEqual(iteration.__dict__.keys(), Iteration.__annotations__.keys(),
                                 "Iteration fields have changed, this may break existing user files")
                self.assertEqual(iteration.model.__dict__.keys(), ModelInfo.__annotations__.keys(),
                                 "ModelInfo fields have changed, this may break existing user files")
