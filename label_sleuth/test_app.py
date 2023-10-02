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
import os
import time
import tempfile
import unittest
from label_sleuth import app, config, app_utils
from label_sleuth.data_access.core.data_structs import WorkspaceModelType
from label_sleuth.orchestrator.core.state_api.orchestrator_state_api import IterationStatus
from unittest import mock


HEADERS = {'Content-Type': 'application/json'}


class TestAppIntegration(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.TemporaryDirectory()
        path_to_test_config = os.path.abspath(os.path.join(__file__, os.pardir, "config_for_tests.json"))
        loaded_config = config.load_config(path_to_test_config)
        # avoid downloading spacy model for test
        loaded_config.language.spacy_model_name = None
        
        app_for_test = app.create_app(
            config=loaded_config,
            output_dir=os.path.join(cls.temp_dir.name, 'output'),
            customizable_ui_text_path=os.path.abspath(os.path.join(__file__, os.pardir, "ui_customs_for_tests.json"))
        )   
        app_for_test.test_request_context("/")
        app_for_test.config['TESTING'] = True
        app_for_test.config['LOGIN_DISABLED'] = True

        print(f"Integration tests, all output files will be written under {cls.temp_dir}")
        cls.client = app_for_test.test_client()

    @classmethod
    def tearDownClass(cls):
        cls.temp_dir.cleanup()

    def test_full_flow(self):
        ui_defaults = app_utils.get_default_customizable_UI_text()

        def raise_exception(a, b):
            # to make getting the customizable text json to fail and the defaults to work
            raise FileNotFoundError()
        
        # patching get_default_customizable_UI_text because it uses open() too
        with mock.patch('label_sleuth.app_utils.get_default_customizable_UI_text', side_effect=lambda: ui_defaults):
            with mock.patch('builtins.open', raise_exception):
                res = self.client.get("/customizable_ui_text", headers=HEADERS) 
        self.assertEqual(404, res.status_code)
        self.assertEqual(res.get_json()["title"], "The json file with the UI customizable elements was not found.")

        # use an incorrect key
        with mock.patch('label_sleuth.app_utils.get_default_customizable_UI_text', side_effect=lambda: ui_defaults):
            with mock.patch('builtins.open', mock.mock_open(read_data='{"this_key_doesnt_exist": "hello tests", "this_key_doesnt_exist_either": "hello tests"}')):
                res = self.client.get("/customizable_ui_text", headers=HEADERS)
        self.assertEqual(404, res.status_code)
        self.assertEqual(res.get_json()["title"], "The following keys in the provided customizable UI elements are not supported: this_key_doesnt_exist, this_key_doesnt_exist_either.")

        res = self.client.get("/customizable_ui_text", headers=HEADERS)
        correct_body = {
            "category_description_placeholder": "",
            "category_modal_helper_text": "Please select a meaningful name for your category.",
            "slack_link_url": "https://join.slack.com/t/labelsleuth/shared_invite/zt-1j5tpz1jl-W~UaNEKmK0RtzK~lI3Wkxg",
            "slack_link_title": "Join Slack",
            "github_link_url": "https://github.com/label-sleuth/label-sleuth",
            "github_link_title": "Github",
            "webpage_link_url": "https://www.label-sleuth.org/docs/index.html",
            "webpage_link_title": "Documentation",
            "ls_brief_description": "Quickly create a text classifier",
            "app_logo_path": "assets/sleuth_logo_white.svg",
            "document_upload_helper_text": "The csv file must have a header line (of \"text\" and optional \"document_id\")",
            "system_unavailable": "This is customized",
            "next_zero_shot_model_training_msg": "",
            "download_model_description": "",
            "download_model_bullets": [
                "the model itself", 
                "a code snippet demonstrating how it can be used within a Python application"
            ],
            "insufficient_train_data_toast_message": "Please use a query to label more positive elements",
            "insufficient_train_data_toast_description": "The model did not train due to insufficient number of positive labels. Use the search panel at the top-right side to query the data and collect more positive labels manually."
        }
        self.assertEqual(res.get_json(), correct_body)

        res = self.client.get("/assets/sleuth_logo_white.svg")
        self.assertEqual("image/svg+xml; charset=utf-8", res.content_type, msg="Failed to get app logo, request is returning index.html")

        self.maxDiff = None
        dataset_name = "my_test_dataset"
        workspace_name = "my_test_workspace"
        category_name = "my_category"
        category_description = "my_category_description"
        data, text_with_parenthesis, text_with_parenthesis_snippet, text_with_parenthesis_snippet_in_query = self.create_dataset(
            dataset_name)

        data['file'] = (io.BytesIO(
            b'document_id,text\n'
            b'document3,"adding this text element makes the request to fail because of the row count limit of 7"\n'),
                        'my_file.csv')
        res = self.client.post(f"/datasets/{dataset_name}/add_documents", data=data, headers=HEADERS,
                               content_type='multipart/form-data')
        
        self.assertEqual(409, res.status_code, msg="Failed to upload a new dataset")

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
             'model_predictions': None, 'text': 'document 3 has three text elements, this is the first',
             'user_labels': None},
            {'begin': 54, 'docid': 'my_test_dataset-document3', 'end': 141, 'id': 'my_test_dataset-document3-1',
             'model_predictions': None,
             'text': 'document 3 has three text elements, this is the second that will be labeled as negative',
             'user_labels': None},
            {'begin': 142, 'docid': 'my_test_dataset-document3', 'end': 195, 'id': 'my_test_dataset-document3-2',
             'model_predictions': None, 'text': 'document 3 has three text elements, this is the third',
             'user_labels': None},
            {
            "begin": 196, "docid": "my_test_dataset-document3", "end": 317, "id": "my_test_dataset-document3-3",
            "model_predictions": None, "text": text_with_parenthesis,
            "user_labels": None}],
            document3_elements, msg=f"diff in {documents[-1]['document_id']} content")
        res = self.client.put(f'/workspace/{workspace_name}/element/{document3_elements[0]["id"]}',
                              data='{{"category_id":"{}","value":{}}}'.format(category_id, 'true'), headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to set the first label for a category")
        self.assertEqual({'category_id': str(category_id),
                          'element': {'begin': 0, 'docid': 'my_test_dataset-document3', 'end': 53,
                                      'id': 'my_test_dataset-document3-0', 'model_predictions': None,
                                      'text': 'document 3 has three text elements, this is the first',
                                      'user_labels': {str(category_id): 'true'}}, 'workspace_id': 'my_test_workspace'},
                         res.get_json(), msg="diff in setting element's label response")
        res = self.client.get(f"/workspace/{workspace_name}/status?category_id={category_id}",
                              headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to get status after successfully setting the first label")
        self.assertEqual({'labeling_counts': {'true': 1}, 'progress': {'all': 33}},
                         res.get_json(), msg="diffs in get status response after setting a label")

        res = self.client.put(f'/workspace/{workspace_name}/element/{document3_elements[2]["id"]}',
                              data='{{"category_id":"{}","value":{}}}'.format(category_id, 'true'), headers=HEADERS)

        self.assertEqual(200, res.status_code, msg="Failed to set the third label for category")
        self.assertEqual({'category_id': str(category_id),
                          'element': {'begin': 142, 'docid': 'my_test_dataset-document3', 'end': 195,
                                      'id': 'my_test_dataset-document3-2', 'model_predictions': None,
                                      'text': 'document 3 has three text elements, this is the third',
                                      'user_labels': {str(category_id): 'true'}}, 'workspace_id': 'my_test_workspace'},
                         res.get_json())

        res = self.client.get(f"/workspace/{workspace_name}/query?category_id={category_id}&qry_string=(",
                              headers=HEADERS)
        self.assertEqual(
            {"elements": [
                {
                    "begin": 196,"docid": "my_test_dataset-document3","end": 317,"id": "my_test_dataset-document3-3","model_predictions": None,
                    "snippet": text_with_parenthesis_snippet_in_query,
                    "text": text_with_parenthesis,
                    "user_labels": None
                }
            ], "hit_count": 1,  "hit_count_unique": 1}, 
            res.get_json(), 
            msg="The searched text differs from the response"
        )
        res = self.client.get(f"/workspace/{workspace_name}/status?category_id={category_id}",
                              headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to get status after successfully setting the second label")
        self.assertEqual({'labeling_counts': {'true': 2}, 'progress': {'all': 50}},
                         res.get_json(),
                         msg="diffs in get status response after setting the second label")

        res = self.client.put(f'/workspace/{workspace_name}/element/{document3_elements[1]["id"]}',
                              data='{{"category_id":"{}","value":{}}}'.format(category_id, 'false'),
                              headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to set the second label for a category")
        self.assertEqual({'category_id': str(category_id),
                          'element': {'begin': 54, 'docid': 'my_test_dataset-document3', 'end': 141,
                                      'id': 'my_test_dataset-document3-1', 'model_predictions': None,
                                      'text': 'document 3 has three text elements, '
                                              'this is the second that will be labeled as negative',
                                      'user_labels': {str(category_id): 'false'}}, 'workspace_id': 'my_test_workspace'},
                         res.get_json(), msg="diff in setting element's label response")
        res = self.client.get(f"/workspace/{workspace_name}/status?category_id={category_id}",
                              headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to get status after successfully setting the third label")
        self.assertEqual({'true': 2, 'false': 1},
                         res.get_json()['labeling_counts'], msg="diffs in get status response after setting a label")

        res = self.wait_for_new_iteration(category_id, res, workspace_name, 1, workspace_mode=WorkspaceModelType.Binary)

        self.assertEqual(200, res.status_code, msg="Failed to get iterations list")
        self.assertEqual(1, len(res.get_json()["iterations"]), msg="first model was not added to the models list")

        # get predictions stats
        res = self.client.get(f"/workspace/{workspace_name}/prediction_stats?category_id={category_id}",
                              headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to get prediction stats in the third label")
        prediction_stats = res.get_json()
        self.assertEqual({'true','false'}, set(prediction_stats.keys()), msg = "not all labels in prediction stats")
        self.assertEqual(7, sum([x['count'] for x in prediction_stats.values()]),msg="prediction counts does not sum to the number of elements in the dataset")
        self.assertEqual(1, round(sum([x['fraction'] for x in prediction_stats.values()])),
                         msg="prediction fraction does not sum to 1")



        # elements by positive prediction
        res = self.client.get(f"/workspace/{workspace_name}/elements_by_prediction?value=True&category_id=0",
                              headers=HEADERS)
        self.assertEqual(200, res.status_code,
                         msg="Failed to get elements by positive prediction for category 0")

        self.assertEqual({'count': 6, 'elements':
            [{'begin': 0, 'docid': 'my_test_dataset-document1', 'end': 46, 'id': 'my_test_dataset-document1-0',
              'model_predictions': {'0': 'true'}, 'text': 'this is the first text element of document one',
              'user_labels': None},
             {'begin': 47, 'docid': 'my_test_dataset-document1', 'end': 94, 'id': 'my_test_dataset-document1-1',
              'model_predictions': {'0': 'true'}, 'text': 'this is the second text element of document one',
              'user_labels': None},
             {'begin': 0, 'docid': 'my_test_dataset-document2', 'end': 45, 'id': 'my_test_dataset-document2-0',
              'model_predictions': {'0': 'true'}, 'text': 'this is the only text element in document two',
              'user_labels': None},
             {'begin': 0, 'docid': 'my_test_dataset-document3', 'end': 53, 'id': 'my_test_dataset-document3-0',
              'model_predictions': {'0': 'true'}, 'text': 'document 3 has three text elements, this is the first',
              'user_labels': {'0': 'true'}},
             {'begin': 142, 'docid': 'my_test_dataset-document3', 'end': 195, 'id': 'my_test_dataset-document3-2',
              'model_predictions': {'0': 'true'}, 'text': 'document 3 has three text elements, this is the third',
              'user_labels': {'0': 'true'}},
             {'begin': 196, 'docid': 'my_test_dataset-document3', 'end': 317, 'id': 'my_test_dataset-document3-3',
              'model_predictions': {'0': 'true'},
          'snippet': 'this text contains a parenthesis a a a a a ... x and some more text to force creating a snippet',
              'text': 'this text contains a parenthesis a a a a a a(b b b b b b c c c c ( x x x x and some more '
                      'text to force creating a snippet', 'user_labels': None}], 'fraction': 0.8571428571428571},
                         res.get_json(), msg="Failed to get elements by positive prediction")

        # elements by negative prediction
        res = self.client.get(f"/workspace/{workspace_name}/elements_by_prediction?value=False&category_id=0",
                              headers=HEADERS)
        self.assertEqual(200, res.status_code,
                         msg="Failed to get elements by positive prediction for category 0")

        self.assertEqual({'count': 1,
                  'elements': [{'begin': 54, 'docid': 'my_test_dataset-document3',
                    'end': 141, 'id': 'my_test_dataset-document3-1',
                    'model_predictions': {'0': 'false'},
                    'text': 'document 3 has three text elements, this is the second that will be labeled as negative',
                                'user_labels': {'0': 'false'}}], 'fraction': 0.14285714285714285},
                         res.get_json(), msg="Failed to get elements by positive prediction")

        # get active learning recommendations
        res = self.client.get(f"/workspace/{workspace_name}/active_learning?category_id={category_id}",
                              headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to get active learning recommendations")
        active_learning_response = res.get_json()
        self.assertEqual({'elements': [
            {'begin': 47, 'docid': 'my_test_dataset-document1', 'end': 94, 'id': 'my_test_dataset-document1-1',
             'model_predictions': {str(category_id): 'true'}, 'text': 'this is the second text element of document one',
             'user_labels': None},
            {"begin": 196, "docid": "my_test_dataset-document3", "end": 317, "id": "my_test_dataset-document3-3",
             "model_predictions": {"0": "true"}, "snippet": text_with_parenthesis_snippet, "text": text_with_parenthesis,
             "user_labels": None},
            {'begin': 0, 'docid': 'my_test_dataset-document2', 'end': 45, 'id': 'my_test_dataset-document2-0',
             'model_predictions': {str(category_id): 'true'}, 'text': 'this is the only text element in document two',
             'user_labels': None},
            {'begin': 0, 'docid': 'my_test_dataset-document1', 'end': 46, 'id': 'my_test_dataset-document1-0',
             'model_predictions': {str(category_id): 'true'}, 'text': 'this is the first text element of document one',
             'user_labels': None}], 'hit_count': 4},
            active_learning_response)

        # set the first label according to the active learning recommendations
        res = self.client.put(f'/workspace/{workspace_name}/element/{active_learning_response["elements"][0]["id"]}',
                              data='{{"category_id":"{}","value":{}}}'.format(category_id, 'true'), headers=HEADERS)

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
        self.assertEqual({'labeling_counts': {'true': 3, 'false': 1}, 'progress': {'all': 33}},
                         res.get_json(), msg="diffs in get status response after setting a label")

        # set the second label according to the active learning recommendations
        res = self.client.put(f'/workspace/{workspace_name}/element/{active_learning_response["elements"][2]["id"]}',
                              data='{{"category_id":"{}","value":{}}}'.format(category_id, 'false'),
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
                         msg="Failed to get status after successfully setting the second label for the second model")
        self.assertEqual({'true': 3, 'false': 2},
                         res.get_json()['labeling_counts'], msg="diffs in get status response after setting a label")

        # get positively labeled elements
        res = self.client.get(f"/workspace/{workspace_name}/elements_by_label?category_id={category_id}&value=True",
                              headers=HEADERS)
        self.assertEqual(200, res.status_code,
                         msg="Failed to get positively labeled elements")
        self.assertEqual({'elements': [{'begin': 142,
                           'docid': 'my_test_dataset-document3',
                           'end': 195,
                           'id': 'my_test_dataset-document3-2',
                           'model_predictions': {'0': 'true'},
                           'text': 'document 3 has three text elements, this is the third',
                           'user_labels': {'0': 'true'}},
                          {'begin': 0,
                           'docid': 'my_test_dataset-document3',
                           'end': 53,
                           'id': 'my_test_dataset-document3-0',
                           'model_predictions': {'0': 'true'},
                           'text': 'document 3 has three text elements, this is the first',
                           'user_labels': {'0': 'true'}},
                          {'begin': 47,
                           'docid': 'my_test_dataset-document1',
                           'end': 94,
                           'id': 'my_test_dataset-document1-1',
                           'model_predictions': {'0': 'true'},
                           'text': 'this is the second text element of document one',
                           'user_labels': {'0': 'true'}}],
                             'hit_count': 3},
                        res.get_json(), msg="diffs in positively labeled elements")


        # get negatively labeled elements
        res = self.client.get(f"/workspace/{workspace_name}/elements_by_label?category_id={category_id}&value=False",
                              headers=HEADERS)
        self.assertEqual(200, res.status_code,
                         msg="Failed to get negatively labeled elements")
        self.assertEqual({'elements': [{'begin': 54,
                           'docid': 'my_test_dataset-document3',
                           'end': 141,
                           'id': 'my_test_dataset-document3-1',
                           'model_predictions': {'0': 'false'},
                           'text': 'document 3 has three text elements, this is the second '
                                   'that will be labeled as negative',
                           'user_labels': {'0': 'false'}},
                          {'begin': 0,
                           'docid': 'my_test_dataset-document2',
                           'end': 45,
                           'id': 'my_test_dataset-document2-0',
                           'model_predictions': {'0': 'true'},
                           'text': 'this is the only text element in document two',
                           'user_labels': {'0': 'false'}}],
                            'hit_count': 2},
                        res.get_json(), msg="diffs in negatively labeled elements")


        # continue labeling from AL suggestions to get a new model (removing a negative label -> false count decrease)
        res = self.client.put(f'/workspace/{workspace_name}/element/{active_learning_response["elements"][2]["id"]}',
                              data='{{"category_id":"{}","value":{}}}'.format(category_id, "true"), headers=HEADERS)
        self.assertEqual(200, res.status_code,
                         msg="Failed to set the label for the first element recommended by the active learning")
        self.assertEqual({'category_id': '0',
                          'element': {
                              'begin': 0, 'docid': 'my_test_dataset-document2', 'end': 45, 'id': 'my_test_dataset-document2-0',
                              'model_predictions': {'0': 'true'}, 'text': 'this is the only text element in document two',
                              'user_labels': {'0': 'true'}}, 'workspace_id': 'my_test_workspace'},
                         res.get_json())

        res = self.client.get(f"/workspace/{workspace_name}/status?category_id={category_id}",
                              headers=HEADERS)
        self.assertEqual(200, res.status_code,
                         msg="Failed to get status after successfully setting the third label for the second model")
        self.assertEqual({'true': 4, 'false': 1},
                         res.get_json()['labeling_counts'], msg="diffs in get status response after setting a label")

        # wait for the second models
        res = self.wait_for_new_iteration(category_id, res, workspace_name, 2, workspace_mode=WorkspaceModelType.Binary)
        self.assertEqual(200, res.status_code, msg="Failed to get models list")
        self.assertEqual(2, len(res.get_json()["iterations"]), msg="second model was not added to the models list")

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

    def create_dataset(self, dataset_name):
        data = {}
        text_with_parenthesis = "this text contains a parenthesis a a a a a a(b b b b b b c c c c ( x x x x and some more text to force creating a snippet"
        text_with_parenthesis_snippet = "this text contains a parenthesis a a a a a ... x and some more text to force creating a snippet"
        text_with_parenthesis_snippet_in_query = " ... a a a a a(b b b b b ... c c c c ( x x x x ... "
        data['file'] = (io.BytesIO(bytes(
            'document_id,text\n'
            'document1,this is the first text element of document one\n'
            'document1,this is the second text element of document one\n'
            'document2,this is the only text element in document two\n'
            'document3,"document 3 has three text elements, this is the first"\n'
            'document3,"document 3 has three text elements, this is the second that will be labeled as negative"\n'
            'document3,"document 3 has three text elements, this is the third"\n'
            f'document3,{text_with_parenthesis}\n', 'utf-8')),
                        'my_file.csv')
        res = self.client.post(f"/datasets/{dataset_name}/add_documents", data=data, headers=HEADERS,
                               content_type='multipart/form-data')
        self.assertEqual(200, res.status_code, msg="Failed to upload a new dataset")
        self.assertEqual(
            {'dataset_name': dataset_name, 'num_docs': 3, 'num_sentences': 7, 'workspaces_to_update': []},
            res.get_json(), msg="diff in upload dataset response")
        return data, text_with_parenthesis, text_with_parenthesis_snippet, text_with_parenthesis_snippet_in_query

    def wait_for_new_iteration(self, category_id, res, workspace_name, num_models, workspace_mode):
        waiting_count = 0
        MAX_WAITING_FOR_TRAINING = 100
        # wait maximum 10 seconds (100*0.1) for the training
        # (should be much faster but it sometimes takes longer on github actions)
        while waiting_count < MAX_WAITING_FOR_TRAINING:
            # since get_status is asynchronously starting a new training, we need to wait until it added to the
            # iterations list and finishes successfully
            res = self.client.get(f"/workspace/{workspace_name}/"
                                  f"iterations?{f'category_id={category_id}&' if category_id is not None else ''}"
                                  f"mode={workspace_mode.name}",
                                  headers=HEADERS)
            response = res.get_json()

            if res.status_code != 200 or \
                    (len(response["iterations"]) == num_models
                     and response['iterations'][num_models-1]['iteration_status'] == IterationStatus.READY.name):
                break
            time.sleep(0.1)
            waiting_count += 1
        return res

    def test_full_flow_multiclass(self):
        workspace_name = "multiclass_workspace"
        dataset_name = "multiclass_dataset"
        data, text_with_parenthesis, text_with_parenthesis_snippet, text_with_parenthesis_snippet_in_query = \
            self.create_dataset(dataset_name)
        res = self.client.post("/workspace",
                               data='{{"workspace_id":"{}","dataset_id":"{}","workspace_type":"MultiClass"}}'.format(workspace_name, dataset_name),
                               headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to create a workspace")
        self.assertEqual(
            {"workspace": {'dataset_name': 'multiclass_dataset', 'first_document_id': 'multiclass_dataset-document1',
                           'workspace_id': 'multiclass_workspace'}}, res.get_json(),
            msg="diff in create workspace response")

        # /status endpoint has to work when there are no categories
        res = self.client.get(f"/workspace/{workspace_name}/status?mode=MultiClass", headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to get status for a newly-created workspace")

        category_name1 = "cat1"
        category_name2 = "cat2"
        category_name3 = "cat3"
        category_desc1 = "desc1"
        category_desc2 = "desc2"
        category_desc3 = "desc3"

        # add initial category list
        for category_name, category_description in zip([category_name1, category_name2],
                                                       [category_desc1, category_desc2]):
            res = self.client.post(f"/workspace/{workspace_name}/category",
                                   data='{{"category_name":"{}","category_description":"{}"}}'.format(category_name,
                                                                                                  category_description),
                                headers=HEADERS)
            category_id = int(res.get_json()["category_id"])
            self.assertEqual(200, res.status_code, msg="Failed to add a new category to workspace")
            self.assertEqual({'category_description': category_description,
                              'category_name': category_name, 'category_id': str(category_id)}, res.get_json(),
                             msg="diff in create category response")


        # add more category name to an existing category list
        res = self.client.post(f"/workspace/{workspace_name}/category",
                               data='{{"category_name":"{}","category_description":"{}"}}'.format(category_name3,
                                                                                                  category_desc3),
                               headers=HEADERS)
        category_id = int(res.get_json()["category_id"])
        self.assertEqual(200, res.status_code, msg="Failed to add a new category to workspace")
        self.assertEqual({'category_description': category_desc3,
                          'category_name': category_name3, 'category_id': str(category_id)}, res.get_json(),
                         msg="diff in create category response")

        res = self.client.get(f"/workspace/{workspace_name}/documents", headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to get all documents uris")
        documents = res.get_json()['documents']
        self.assertEqual(3, len(documents),
                         msg="Number of retrieved documents is different the number of documents loaded")
        self.assertEqual({'documents': [{'document_id': 'multiclass_dataset-document1'},
                                        {'document_id': 'multiclass_dataset-document2'},
                                        {'document_id': 'multiclass_dataset-document3'}]}, res.get_json(),
                         msg="diff in get documents")
        res = self.client.get(f"/workspace/{workspace_name}/document/{documents[-1]['document_id']}", headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to add a document before labeling")
        document3_elements = res.get_json()['elements']

        self.assertEqual([
            {'begin': 0, 'docid': 'multiclass_dataset-document3', 'end': 53, 'id': 'multiclass_dataset-document3-0',
             'model_predictions': None, 'text': 'document 3 has three text elements, this is the first',
             'user_labels': None},
            {'begin': 54, 'docid': 'multiclass_dataset-document3', 'end': 141, 'id': 'multiclass_dataset-document3-1',
             'model_predictions': None,
             'text': 'document 3 has three text elements, this is the second that will be labeled as negative',
             'user_labels': None},
            {'begin': 142, 'docid': 'multiclass_dataset-document3', 'end': 195, 'id': 'multiclass_dataset-document3-2',
             'model_predictions': None, 'text': 'document 3 has three text elements, this is the third',
             'user_labels': None},
            {
                "begin": 196, "docid": "multiclass_dataset-document3", "end": 317, "id": "multiclass_dataset-document3-3",
                "model_predictions": None, "text": text_with_parenthesis,
                "user_labels": None}],
            document3_elements, msg=f"diff in {documents[-1]['document_id']} content")

        # set first element and get status
        res = self.client.put(f'/workspace/{workspace_name}/element/{document3_elements[0]["id"]}?mode=MultiClass',
                              data='{"value":0}', headers=HEADERS)

        self.assertEqual({"category_id": "None", "workspace_id": "multiclass_workspace",
                          "element": {
                            "begin": 0,
                            "docid": "multiclass_dataset-document3",
                            "end": 53,
                            "id": "multiclass_dataset-document3-0",
                            "model_predictions": None,
                            "text": "document 3 has three text elements, this is the first",
                            "user_labels": 0}
                          }, res.get_json())

        res = self.client.get(f"/workspace/{workspace_name}/status?mode=MultiClass", headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to get status after successfully setting the first label")
        self.assertEqual({'labeling_counts': {'0': 1, '1': 0, '2': 0}, 'progress': {'all': 33}},
                         res.get_json(), msg="diffs in get status response after setting a label")

        # set second element and get status
        res = self.client.put(f'/workspace/{workspace_name}/element/{document3_elements[1]["id"]}?mode=MultiClass',
                              data='{"value":1}', headers=HEADERS)

        self.assertEqual({"category_id": "None", "workspace_id": "multiclass_workspace",
                          "element": {
                            "begin": 54,
                            "docid": "multiclass_dataset-document3",
                            "end": 141,
                            "id": "multiclass_dataset-document3-1",
                            "model_predictions": None,
                            "text": "document 3 has three text elements, this is the second that will be labeled as negative",
                            "user_labels": 1}
                          }, res.get_json())

        res = self.client.get(f"/workspace/{workspace_name}/status?mode=MultiClass", headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to get status after successfully setting the second label")
        self.assertEqual({'labeling_counts': {'0': 1, '1': 1, '2': 0}, 'progress': {'all': 67}},
                         res.get_json(), msg="diffs in get status response after setting the second label")

        # set third element and get status
        res = self.client.put(f'/workspace/{workspace_name}/element/{document3_elements[2]["id"]}?mode=MultiClass',
                              data='{"value":2}', headers=HEADERS)

        self.assertEqual({"category_id": "None", "workspace_id": "multiclass_workspace",
                          "element": {
                            "begin": 142,
                            "docid": "multiclass_dataset-document3",
                            "end": 195,
                            "id": "multiclass_dataset-document3-2",
                            "model_predictions": None,
                            "text": "document 3 has three text elements, this is the third",
                            "user_labels": 2}
                          }, res.get_json())
    

        res = self.client.get(f"/workspace/{workspace_name}/status?mode=MultiClass", headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to get status after successfully setting the third label")
        self.assertEqual({'0': 1, '1': 1, '2': 1},
                         res.get_json()['labeling_counts'], msg="diffs in get status response after setting a label")

        res = self.client.get(f"/workspace/{workspace_name}/query?qry_string=second%20text",
                              headers=HEADERS)
        self.assertEqual(
            {
                "elements": [
                    {
                        "begin": 47,
                        "docid": "multiclass_dataset-document1",
                        "end": 94,
                        "id": "multiclass_dataset-document1-1",
                        "model_predictions": None,
                        "text": "this is the second text element of document one",
                        "user_labels": None
                    }
            ],
                "hit_count": 1,
                "hit_count_unique": 1
            },
            res.get_json(),
            msg="The searched text differs from the response"
        )

        res = self.wait_for_new_iteration(None, res, workspace_name, 1, workspace_mode=WorkspaceModelType.MultiClass)

        self.assertEqual(200, res.status_code, msg="Failed to get iterations list")
        self.assertEqual(1, len(res.get_json()["iterations"]), msg="first model was not added to the models list")

        # get active learning recommendations
        res = self.client.get(f"/workspace/{workspace_name}/active_learning", headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to get active learning recommendations")
        active_learning_response = res.get_json()

        # classifier behavior is non-deterministic, so we change the predictions for the test
        for d in active_learning_response['elements']:
            d['model_predictions'] = 2

        self.assertEqual({'elements': [
            {'begin': 47, 'docid': 'multiclass_dataset-document1', 'end': 94, 'id': 'multiclass_dataset-document1-1',
             'model_predictions': 2, 'text': 'this is the second text element of document one',
             'user_labels': None},
            {
                "begin": 196, "docid": "multiclass_dataset-document3", "end": 317, "id": "multiclass_dataset-document3-3",
                "model_predictions": 2, "snippet": text_with_parenthesis_snippet,
                "text": text_with_parenthesis,
                "user_labels": None},
            {'begin': 0, 'docid': 'multiclass_dataset-document2', 'end': 45, 'id': 'multiclass_dataset-document2-0',
             'model_predictions': 2, 'text': 'this is the only text element in document two',
             'user_labels': None},
            {'begin': 0, 'docid': 'multiclass_dataset-document1', 'end': 46, 'id': 'multiclass_dataset-document1-0',
             'model_predictions': 2, 'text': 'this is the first text element of document one',
             'user_labels': None}], 'hit_count': 4},
            active_learning_response)

        # set the first label according to the active learning recommendations
        res = self.client.put(f'/workspace/{workspace_name}/element/{active_learning_response["elements"][0]["id"]}?mode=MultiClass',
                              data='{"value":2}', headers=HEADERS)

        self.assertEqual(200, res.status_code,
                         msg="Failed to set the label for the first element recommended by the active learning")


        # evaluate accuracy
        res = self.client.get(f"/workspace/{workspace_name}/accuracy_evaluation_elements", headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to get elements for accuracy evaluation")
        eval_ids = [d["id"] for d in res.get_json()['elements']]
        for eval_id in eval_ids:
            self.client.put(
                f'/workspace/{workspace_name}/element/{eval_id}?mode=MultiClass',
                data='{"value":1}', headers=HEADERS)
        res = self.client.post(f'/workspace/{workspace_name}/accuracy_evaluation_elements',
                               data='{{"ids":[{}],"changed_elements_count":3,"iteration":0}}'.format(
                                   ','.join(f'"{eval_id}"' for eval_id in eval_ids)),
                               headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to calculate accuracy evaluation")
        self.assertGreaterEqual(res.get_json()['score'], 0.0, msg="Calculated accuracy is invalid")
        self.assertLessEqual(res.get_json()['score'], 1.0, msg="Calculated accuracy is invalid")

        # elements by label
        res = self.client.get(f"/workspace/{workspace_name}/elements_by_label?value=0&mode=MultiClass",
                              headers=HEADERS)
        self.assertEqual(200, res.status_code,
                         msg="Failed to get labeled elements from category 0")
        self.assertEqual({'elements': [{'begin': 0, 'docid': 'multiclass_dataset-document3', 'end': 53, 'id': 'multiclass_dataset-document3-0', 'model_predictions': 0, 'text': 'document 3 has three text elements, this is the first', 'user_labels': 0}], 'hit_count': 1},
            res.get_json(), msg="diffs in labeled elements for class 0")

        # get predictions stats
        res = self.client.get(f"/workspace/{workspace_name}/prediction_stats?mode=MultiClass",
                              headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to get prediction stats ")
        prediction_stats = res.get_json()
        self.assertEqual({'0', '1', '2'}, set(prediction_stats.keys()), msg="not all labels in prediction stats")
        self.assertEqual(7, sum([x['count'] for x in prediction_stats.values()]),
                         msg="prediction counts does not sum to the number of elements in the dataset")
        self.assertEqual(1, round(sum([x['fraction'] for x in prediction_stats.values()])),
                         msg="prediction fraction does not sum to 1")


        # elements by prediction
        res = self.client.get(f"/workspace/{workspace_name}/elements_by_prediction?value=0&mode=MultiClass",
                              headers=HEADERS)
        self.assertEqual(200, res.status_code,
                         msg="Failed to get elements by prediction of category 0")
        for element in res.get_json()["elements"]:
            self.assertEqual(0, element["model_predictions"], msg=f"element {element} expected prediction is 0 but got {element['model_predictions']}")


        # delete category 0
        res = self.client.delete(f"/workspace/{workspace_name}/category/0?mode=MultiClass", headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to delete category 0 in multiclass workspace")

        res = self.client.get(f"/workspace/{workspace_name}/categories", headers=HEADERS)
        self.assertEqual(res.get_json()['categories'][0]['deleted'], True, msg='category 0 was not deleted')


        # make sure there are no elements labeled for category 0
        # elements by label
        res = self.client.get(f"/workspace/{workspace_name}/elements_by_label?value=0&mode=MultiClass",
                              headers=HEADERS)
        self.assertEqual(200, res.status_code,
                         msg="Failed to get labeled elements from category 0")
        self.assertEqual({'elements': [], 'hit_count': 0},
                         res.get_json(), msg="labeled elements for category 0 were deleted should not exist in this workspace")


        # delete workspace
        res = self.client.delete(f"/workspace/{workspace_name}",
                               data='{{"workspace_id":"{}","dataset_id":"{}","workspace_type":"MultiClass"}}'.format(workspace_name, dataset_name),
                               headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to delete the multiclass workspace")

        res = self.client.post("/workspace",
                               data='{{"workspace_id":"{}","dataset_id":"{}","workspace_type":"MultiClass"}}'.format(workspace_name, dataset_name),
                               headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to create a new workspace after deleting the old one")

        # test that setting an element's label to none works
        res = self.client.put(f'/workspace/{workspace_name}/element/{document3_elements[2]["id"]}?mode=MultiClass',
            data='{}', headers=HEADERS)
        self.assertEqual(200, res.status_code, msg="Failed to get active learning recommendations")
