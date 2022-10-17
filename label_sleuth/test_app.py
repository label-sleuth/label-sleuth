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

import io
import logging
import os
import time
import tempfile
import unittest
from label_sleuth import app, config
from label_sleuth.orchestrator.core.state_api.orchestrator_state_api import IterationStatus

HEADERS = {'Content-Type': 'application/json'}


class TestAppIntegration(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.TemporaryDirectory()
        path_to_test_config = os.path.abspath(os.path.join(__file__, os.pardir, "config_for_tests.json"))
        loaded_config = config.load_config(path_to_test_config)
        # avoid downloading spacy model for test
        loaded_config.language.spacy_model_name = None
        app_for_test = app.create_app(config=loaded_config,
                                      output_dir=os.path.join(cls.temp_dir.name, 'output'))
        app_for_test.test_request_context("/")
        app_for_test.config['TESTING'] = True
        app_for_test.config['LOGIN_DISABLED'] = True

        print(f"Integration tests, all output files will be written under {cls.temp_dir}")
        cls.client = app_for_test.test_client()

    @classmethod
    def tearDownClass(cls):
        cls.temp_dir.cleanup()

    def test_full_flow(self):
        self.maxDiff = None
        dataset_name = "my_test_dataset"
        workspace_name = "my_test_workspace"
        category_name = "my_category"
        category_description = "my_category_description"
        data = {}
        data['file'] = (io.BytesIO(
            b'document_id,text\n'
            b'document1,this is the first text element of document one\n'
            b'document1,this is the second text element of document one\n'
            b'document2,this is the only text element in document two\n'
            b'document3,"document 3 has three text elements, this is the first"\n'
            b'document3,"document 3 has three text elements, this is the second that will be labeled as negative"\n'
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
        category_id = int(res.get_json()["category_id"])
        self.assertEqual(200, res.status_code, msg="Failed to add a new category to workspace")
        self.assertEqual({'category_description': 'my_category_description',
                          'category_name': category_name, 'category_id': str(category_id)}, res.get_json(),
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
            {'begin': 54, 'docid': 'my_test_dataset-document3', 'end': 141, 'id': 'my_test_dataset-document3-1',
             'model_predictions': {},
             'text': 'document 3 has three text elements, this is the second that will be labeled as negative',
             'user_labels': {}},
            {'begin': 142, 'docid': 'my_test_dataset-document3', 'end': 195, 'id': 'my_test_dataset-document3-2',
             'model_predictions': {}, 'text': 'document 3 has three text elements, this is the third',
             'user_labels': {}}], document3_elements, msg=f"diff in {documents[-1]['document_id']} content")

        res = self.client.put(f'/workspace/{workspace_name}/element/{document3_elements[0]["id"]}',
                              data='{{"category_id":"{}","value":"{}"}}'.format(category_id, True), headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to set the first label for a category")
        self.assertEqual({'category_id': str(category_id),
                          'element': {'begin': 0, 'docid': 'my_test_dataset-document3', 'end': 53,
                                      'id': 'my_test_dataset-document3-0', 'model_predictions': {},
                                      'text': 'document 3 has three text elements, this is the first',
                                      'user_labels': {str(category_id): 'true'}}, 'workspace_id': 'my_test_workspace'},
                         res.get_json(), msg="diff in setting element's label response")
        res = self.client.get(f"/workspace/{workspace_name}/status?category_id={category_id}",
                              headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to get status after successfully setting the first label")
        self.assertEqual({'labeling_counts': {'true': 1}, 'progress': {'all': 50}},
                         res.get_json(), msg="diffs in get status response after setting a label")

        res = self.client.put(f'/workspace/{workspace_name}/element/{document3_elements[1]["id"]}',
                              data='{{"category_id":"{}","value":"{}"}}'.format(category_id, False),
                              headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to set the second label for a category")
        self.assertEqual({'category_id': str(category_id),
                          'element': {'begin': 54, 'docid': 'my_test_dataset-document3', 'end': 141,
                                      'id': 'my_test_dataset-document3-1', 'model_predictions': {},
                                      'text': 'document 3 has three text elements, '
                                              'this is the second that will be labeled as negative',
                                      'user_labels': {str(category_id): 'false'}}, 'workspace_id': 'my_test_workspace'},
                         res.get_json(), msg="diff in setting element's label response")
        res = self.client.get(f"/workspace/{workspace_name}/status?category_id={category_id}",
                              headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to get status after successfully setting the first label")
        self.assertEqual({'labeling_counts': {'true': 1, 'false': 1}, 'progress': {'all': 50}},
                         res.get_json(), msg="diffs in get status response after setting a label")

        res = self.client.put(f'/workspace/{workspace_name}/element/{document3_elements[2]["id"]}',
                              data='{{"category_id":"{}","value":"{}"}}'.format(category_id, True), headers=HEADERS)

        self.assertEqual(200, res.status_code, msg="Failed to set the third label for category")
        self.assertEqual({'category_id': str(category_id),
                          'element': {'begin': 142, 'docid': 'my_test_dataset-document3', 'end': 195,
                                      'id': 'my_test_dataset-document3-2', 'model_predictions': {},
                                      'text': 'document 3 has three text elements, this is the third',
                                      'user_labels': {str(category_id): 'true'}}, 'workspace_id': 'my_test_workspace'},
                         res.get_json())

        res = self.client.get(f"/workspace/{workspace_name}/status?category_id={category_id}",
                              headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to get status after successfully setting the third label")
        self.assertEqual({'true': 2, 'false': 1},
                         res.get_json()['labeling_counts'],
                         msg="diffs in get status response after setting the second label")

        res = self.wait_for_new_iteration(category_id, res, workspace_name, 1)

        self.assertEqual(200, res.status_code, msg="Failed to get models list")
        self.assertEqual(1, len(res.get_json()["models"]), msg="first model was not added to the models list")

        # get active learning recommendations
        res = self.client.get(f"/workspace/{workspace_name}/active_learning?category_id={category_id}",
                              headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to get active learning recommendations")
        active_learning_response = res.get_json()
        self.assertEqual({'elements': [
            {'begin': 47, 'docid': 'my_test_dataset-document1', 'end': 94, 'id': 'my_test_dataset-document1-1',
             'model_predictions': {str(category_id): 'true'}, 'text': 'this is the second text element of document one',
             'user_labels': {}},
            {'begin': 0, 'docid': 'my_test_dataset-document2', 'end': 45, 'id': 'my_test_dataset-document2-0',
             'model_predictions': {str(category_id): 'true'}, 'text': 'this is the only text element in document two',
             'user_labels': {}},
            {'begin': 0, 'docid': 'my_test_dataset-document1', 'end': 46, 'id': 'my_test_dataset-document1-0',
             'model_predictions': {str(category_id): 'true'}, 'text': 'this is the first text element of document one',
             'user_labels': {}}], 'hit_count': 3},
            active_learning_response)

        # set the first label according to the active learning recommendations
        res = self.client.put(f'/workspace/{workspace_name}/element/{active_learning_response["elements"][0]["id"]}',
                              data='{{"category_id":"{}","value":"{}"}}'.format(category_id, True), headers=HEADERS)

        self.assertEqual(200, res.status_code,
                         msg="Failed to set the label for the first element recommended by the active learning")
        self.assertEqual({'category_id': str(category_id),
                          'element': {'begin': 47, 'docid': 'my_test_dataset-document1', 'end': 94,
                                      'id': 'my_test_dataset-document1-1',
                                      'model_predictions': {str(category_id): 'true'},
                                      'text': 'this is the second text element of document one',
                                      'user_labels': {str(category_id): 'true'}}, 'workspace_id': 'my_test_workspace'},
                         res.get_json())

        res = self.client.get(f"/workspace/{workspace_name}/status?category_id={category_id}",
                              headers=HEADERS)
        self.assertEqual(200, res.status_code,
                         msg="Failed to get status after successfully setting the first label for the second model")
        self.assertEqual({'labeling_counts': {'true': 3, 'false': 1}, 'progress': {'all': 50}},
                         res.get_json(), msg="diffs in get status response after setting a label")

        # set the second label according to the active learning recommendations
        res = self.client.put(f'/workspace/{workspace_name}/element/{active_learning_response["elements"][1]["id"]}',
                              data='{{"category_id":"{}","value":"{}"}}'.format(category_id, False),
                              headers=HEADERS)

        self.assertEqual(200, res.status_code,
                         msg="Failed to set the label for the first element recommended by the active learning")
        self.assertEqual({'category_id': str(category_id),
                          'element': {'begin': 0, 'docid': 'my_test_dataset-document2', 'end': 45,
                                      'id': 'my_test_dataset-document2-0',
                                      'model_predictions': {str(category_id): 'true'},
                                      'text': 'this is the only text element in document two',
                                      'user_labels': {str(category_id): 'false'}}, 'workspace_id': 'my_test_workspace'},
                         res.get_json())

        res = self.client.get(f"/workspace/{workspace_name}/status?category_id={category_id}",
                              headers=HEADERS)
        self.assertEqual(200, res.status_code,
                         msg="Failed to get status after successfully setting the first label for the second model")
        self.assertEqual({'true': 3, 'false': 2},
                         res.get_json()['labeling_counts'], msg="diffs in get status response after setting a label")

        # get positively labeled elements
        res = self.client.get(f"/workspace/{workspace_name}/positive_elements?category_id={category_id}",
                              headers=HEADERS)
        self.assertEqual(200, res.status_code,
                         msg="Failed to get positively labeled elements")
        self.assertEqual({'elements': [
                            {'begin': 0,
                            'docid': 'my_test_dataset-document3',
                            'end': 53,
                            'id': 'my_test_dataset-document3-0',
                            'model_predictions': {'0': 'true'},
                            'text': 'document 3 has three text elements, this is '
                                    'the first',
                            'user_labels': {'0': 'true'}},
                            {'begin': 47,
                            'docid': 'my_test_dataset-document1',
                            'end': 94,
                            'id': 'my_test_dataset-document1-1',
                            'model_predictions': {'0': 'true'},
                            'text': 'this is the second text element of document '
                                    'one',
                            'user_labels': {'0': 'true'}},
                            {'begin': 142,
                            'docid': 'my_test_dataset-document3',
                            'end': 195,
                            'id': 'my_test_dataset-document3-2',
                            'model_predictions': {'0': 'true'},
                            'text': 'document 3 has three text elements, this is '
                                    'the third',
                            'user_labels': {'0': 'true'}}], 
                        'hit_count': 3},
                        res.get_json(), msg="diffs in positively labeled elements")

        # get negatively labeled elements
        res = self.client.get(f"/workspace/{workspace_name}/negative_elements?category_id={category_id}",
                              headers=HEADERS)
        self.assertEqual(200, res.status_code,
                         msg="Failed to get negatively labeled elements")
        self.assertEqual({'elements': [
                            {'begin': 0,
                            'docid': 'my_test_dataset-document2',
                            'end': 45,
                            'id': 'my_test_dataset-document2-0',
                            'model_predictions': {'0': 'true'},
                            'text': 'this is the only text element in document two',
                            'user_labels': {'0': 'false'}},
                            {'begin': 54,
                            'docid': 'my_test_dataset-document3',
                            'end': 141,
                            'id': 'my_test_dataset-document3-1',
                            'model_predictions': {'0': 'false'},
                            'text': 'document 3 has three text elements, this is '
                                    'the second that will be labeled as negative',
                            'user_labels': {'0': 'false'}}],
                        'hit_count': 2},
                        res.get_json(), msg="diffs in negatively labeled elements")

        # wait for the second models
        res = self.wait_for_new_iteration(category_id, res, workspace_name, 2)
        self.assertEqual(200, res.status_code, msg="Failed to get models list")
        self.assertEqual(2, len(res.get_json()["models"]), msg="second model was not added to the models list")

        # update existing category
        new_category_name = f'{category_name}_new'
        new_category_description = f'{category_description} new'
        res = self.client.put(f"/workspace/{workspace_name}/category/{category_id}",
                              data='{{"category_name":"{}","category_description":"{}"}}'.format(
                                  new_category_name, new_category_description),
                              headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to update category")

        # delete category and create a new one
        res = self.client.delete(f"/workspace/{workspace_name}/category/{category_id}", headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to delete category")

        res = self.client.get(f"/workspace/{workspace_name}/categories", headers=HEADERS)
        self.assertEqual(len(res.get_json()['categories']), 0, msg='unexpected number of categories')

        res = self.client.post(f"/workspace/{workspace_name}/category",
                               data='{{"category_name":"{}","category_description":"{}"}}'.format(category_name,
                                                                                                  category_description),
                               headers=HEADERS)
        category_id = int(res.get_json()["category_id"])
        self.assertEqual(200, res.status_code, msg="Failed to add a new category to workspace")
        self.assertEqual(res.get_json(),
                         {'category_description': category_description, 'category_name': category_name,
                          'category_id': str(category_id)}, msg="diff in create category response")

        res = self.client.get(f"/workspace/{workspace_name}/categories", headers=HEADERS)
        self.assertEqual(len(res.get_json()['categories']), 1, msg='unexpected number of categories')

        print("Done")

    def wait_for_new_iteration(self, category_id, res, workspace_name, num_models):
        waiting_count = 0
        MAX_WAITING_FOR_TRAINING = 100
        # wait maximum 10 seconds (100*0.1) for the training
        # (should be much faster but it sometimes takes longer on github actions)
        while waiting_count < MAX_WAITING_FOR_TRAINING:
            # since get_status is asynchronously starting a new training, we need to wait until it added to the
            # iterations list and finishes successfully
            res = self.client.get(f"/workspace/{workspace_name}/models?category_id={category_id}",
                                  headers=HEADERS)
            response = res.get_json()
            print(response)
            if res.status_code != 200 or (len(response["models"]) == num_models
                                          and response['models'][0]['iteration_status'] == IterationStatus.READY.name):
                break
            time.sleep(0.1)
            waiting_count += 1
        return res
