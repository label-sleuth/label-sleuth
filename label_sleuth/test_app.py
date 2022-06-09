import io
import os
import tempfile
import unittest
import dacite

import label_sleuth.config
from label_sleuth.active_learning.core.active_learning_factory import ActiveLearningFactory
from label_sleuth.app import ROOT_DIR
from label_sleuth.configurations.users import User
from label_sleuth.data_access.file_based.file_based_data_access import FileBasedDataAccess
from label_sleuth.models.core.models_background_jobs_manager import ModelsBackgroundJobsManager
from label_sleuth.models.core.models_factory import ModelFactory
from label_sleuth.orchestrator.core.state_api.orchestrator_state_api import OrchestratorStateApi
from label_sleuth.orchestrator.orchestrator_api import OrchestratorApi
import label_sleuth.app as app

HEADERS = {'Content-Type': 'application/json'}


class TestAppIntegration(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        app.app.test_request_context("/")
        app.app.config['TESTING'] = True
        app.app.config['LOGIN_DISABLED'] = True
        print(os.getcwd())
        app.CONFIGURATION = label_sleuth.config.load_config(os.path.join(ROOT_DIR,"config_for_tests.json"))
        app.users = {x['username']: dacite.from_dict(data_class=User, data=x) for x in app.CONFIGURATION.users}

        app.tokens = [user.token for user in app.users.values()]
        cls.temp_dir = tempfile.TemporaryDirectory()
        app.ROOT_DIR = cls.temp_dir.name
        print(f"Integration tests, all output files will be written under {cls.temp_dir}")

        app.orchestrator_api = OrchestratorApi(OrchestratorStateApi(os.path.join(app.ROOT_DIR, "output", "workspaces")),
                                               FileBasedDataAccess(os.path.join(app.ROOT_DIR, "output")),
                                               ActiveLearningFactory(),
                                               ModelFactory(os.path.join(app.ROOT_DIR, "output", "models"),
                                                            ModelsBackgroundJobsManager()),
                                               app.CONFIGURATION)
        cls.client = app.app.test_client()

    @classmethod
    def tearDownClass(cls):
        cls.temp_dir.cleanup()

    def test_full_flow(self):
        dataset_name = "my_test_dataset"
        workspace_name = "my_test_workspace"
        category_name = "my_category"
        category_description = "my_category_description"
        data = {}
        data['file'] = (io.BytesIO(b'document_id,text\n'
                                   b'document1,this is the first text element of document one\n'
                                   b'document2,this is the second text element of document one\n'
                                   b'document2,this is the only text element in document two\n'
                                   b'document3,"document 3 has three text elements, this is the first"\n'
                                   b'document3,"document 3 has three text elements, this is the second"\n'
                                   b'document3,"document 3 has three text elements, this is the third"\n'),
                        'my_file.csv')
        res = self.client.post(f"/datasets/{dataset_name}/add_documents", data=data, headers=HEADERS,
                               content_type='multipart/form-data')

        self.assertEqual(200, res.status_code, msg="Failed to upload a new dataset")
        self.assertEqual(
            {'dataset_name': 'my_test_dataset', 'num_docs': 3, 'num_sentences': 6, 'workspaces_to_update': []},
            res.get_json(), msg="diff in upload dataset response")
        res = self.client.post("/workspace",
                               data='{{"workspace_id":"{}","dataset_id":"{}"}}'.format(workspace_name, dataset_name),
                               headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to create a workspace")
        self.assertEqual(
            {"workspace": {'dataset_name': 'my_test_dataset', 'first_document_id': 'my_test_dataset-document1',
                           'workspace_id': 'my_test_workspace'}}, res.get_json(),
            msg="diff in create workspace response")
        res = self.client.post(f"/workspace/{workspace_name}/category",
                               data='{{"category_name":"{}","category_description":"{}"}}'.format(category_name,
                                                                                                  category_description),
                               headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to add a new category to workspace")
        self.assertEqual({'category': {'category_description': 'my_category_description',
                                       'category_name': 'my_category', 'id': 'my_category'}}, res.get_json(),
                         msg="diff in create category response")

        res = self.client.get(f"/workspace/{workspace_name}/documents", headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to get all documents uris")
        documents = res.get_json()['documents']
        self.assertEqual(3, len(documents),
                         msg="Number of retrieved documents is different the number of documents loaded")
        self.assertEqual({'documents': [{'document_id': 'my_test_dataset-document1'},
                                        {'document_id': 'my_test_dataset-document2'},
                                        {'document_id': 'my_test_dataset-document3'}]}, res.get_json(),
                         msg="diff in get documents")
        res = self.client.get(f"/workspace/{workspace_name}/document/{documents[-1]['document_id']}", headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to add a document before labeling")
        document3_elements = res.get_json()['elements']
        self.assertEqual([
            {'begin': 0, 'docid': 'my_test_dataset-document3', 'end': 53, 'id': 'my_test_dataset-document3-0',
             'model_predictions': {}, 'text': 'document 3 has three text elements, this is the first',
             'user_labels': {}},
            {'begin': 54, 'docid': 'my_test_dataset-document3', 'end': 108, 'id': 'my_test_dataset-document3-1',
             'model_predictions': {}, 'text': 'document 3 has three text elements, this is the second',
             'user_labels': {}},
            {'begin': 109, 'docid': 'my_test_dataset-document3', 'end': 162, 'id': 'my_test_dataset-document3-2',
             'model_predictions': {}, 'text': 'document 3 has three text elements, this is the third',
             'user_labels': {}}], document3_elements, msg=f"diff in {documents[-1]['document_id']} content")

        res = self.client.put(f'/workspace/{workspace_name}/element/{document3_elements[0]["id"]}',
                              data='{{"category_name":"{}","value":"{}"}}'.format(category_name, True), headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to set the first label for a category")
        self.assertEqual({'category_name': 'my_category',
                          'element': {'begin': 0, 'docid': 'my_test_dataset-document3', 'end': 53,
                                      'id': 'my_test_dataset-document3-0', 'model_predictions': {},
                                      'text': 'document 3 has three text elements, this is the first',
                                      'user_labels': {'my_category': 'true'}}, 'workspace_id': 'my_test_workspace'},
                         res.get_json(),msg = "diff in setting element's label response")
        res = self.client.get(f"/workspace/{workspace_name}/status?category_name={category_name}",
                              headers = HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to get status after successfully setting the first label")
        self.assertEqual({'labeling_counts': {'true': 1}, 'notifications': [], 'progress': {'all': 50}},
                         res.get_json(),msg = "diffs in get status response after setting a label")

        res = self.client.put(f'/workspace/{workspace_name}/element/{document3_elements[0]["id"]}',
                              data='{{"category_name":"{}","value":"{}"}}'.format(category_name, False), headers=HEADERS)

        print("Done")
