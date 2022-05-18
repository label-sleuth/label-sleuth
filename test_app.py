import io
import os
import random
import tempfile
import unittest
from unittest import mock
from unittest.mock import patch

import dacite
import pandas as pd
import lrtc_lib.config


from lrtc_lib.active_learning.core.active_learning_factory import ActiveLearningFactory
from lrtc_lib.configurations.users import User

from lrtc_lib.data_access.core.data_structs import DisplayFields, Document, Label, LABEL_NEGATIVE, LABEL_POSITIVE
from lrtc_lib.data_access.file_based.file_based_data_access import FileBasedDataAccess
from lrtc_lib.data_access.test_file_based_data_access import generate_corpus
from lrtc_lib.models.core.models_background_jobs_manager import ModelsBackgroundJobsManager
from lrtc_lib.models.core.models_factory import ModelFactory
from lrtc_lib.orchestrator.core.state_api.orchestrator_state_api import OrchestratorStateApi
from lrtc_lib.orchestrator.orchestrator_api import OrchestratorApi
import lrtc_lib.app as app
from lrtc_lib.training_set_selector.training_set_selector_factory import get_training_set_selector

HEADERS = {'Authorization': 'Bearer dummy_bearer',
           'Content-Type': 'application/json'}
class TestAppIntegration(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        app.app.test_request_context("/")
        app.app.config['TESTING'] = True
        app.app.config['LOGIN_DISABLED'] = True
        app.CONFIGURATION = lrtc_lib.config.load_config("./lrtc_lib/config_integration_tests.json")
        app.users = {x['username']: dacite.from_dict(data_class=User, data=x) for x in app.CONFIGURATION.users}

        app.tokens = [user.token for user in app.users.values()]
        app.ROOT_DIR = tempfile.TemporaryDirectory().name

        app.orchestrator_api=OrchestratorApi(OrchestratorStateApi(os.path.join(app.ROOT_DIR,"output","workspaces")),
                                   FileBasedDataAccess(os.path.join(app.ROOT_DIR,"output")),
                                   ActiveLearningFactory(),
                                   ModelFactory(os.path.join(app.ROOT_DIR,"output","models"),ModelsBackgroundJobsManager()),
                                   app.CONFIGURATION)
        cls.client = app.app.test_client()




    @classmethod
    def tearDownClass(cls):
        pass

    def test_full_flow(self):
        dataset_name = "my_test_dataset"
        data = {}
        data['file'] = (io.BytesIO(b'document_id,text\n'
                                   b'document1,this is the first text element of document one\n'
                                   b'document2,this is the second text element of document one\n'
                                   b'document2,this is the only text element in document two\n'
                                   b'document3,"document 3 has three text elets, this is the first"\n'
                                   b'document3,"document 3 has three text elets, this is the second"\n'
                                   b'document3,"document 3 has three text elets, this is the third"\n'), 'my_file.csv')
        res = self.client.post(f"/datasets/{dataset_name}/add_documents", data=data, headers=HEADERS,content_type='multipart/form-data')

        self.assertEqual(200, res.status_code,msg="Failed to upload data")
        res = self.client.post("/workspace",data='{{"workspace_id":"test_workspace","dataset_id":"{}"}}'.format(dataset_name), headers=HEADERS)
        self.assertEqual(200, res.status_code,msg="Failed to create a workspace")
        TestAppIntegration
        print(res)
