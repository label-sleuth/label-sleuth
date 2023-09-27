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
import random
import tempfile
import unittest
from datetime import datetime
from typing import List
from unittest.mock import patch

import pandas as pd

from label_sleuth.active_learning.core.active_learning_factory import ActiveLearningFactory
from label_sleuth.config import load_config
from label_sleuth.data_access.core.data_structs import DisplayFields, Document, Label, LABEL_NEGATIVE, LABEL_POSITIVE, \
    LabeledTextElement, WorkspaceModelType, MulticlassLabel, MulticlassLabeledTextElement
from label_sleuth.data_access.file_based.file_based_data_access import FileBasedDataAccess
from label_sleuth.data_access.test_file_based_data_access import generate_corpus
from label_sleuth.models.core.model_api import ModelStatus
from label_sleuth.models.core.catalog import ModelsCatalog
from label_sleuth.models.core.models_factory import ModelFactory
from label_sleuth.orchestrator.background_jobs_manager import BackgroundJobsManager
from label_sleuth.orchestrator.core.state_api.orchestrator_state_api import OrchestratorStateApi, Iteration, \
    IterationStatus, ModelInfo, MulticlassCategory
from label_sleuth.orchestrator.orchestrator_api import OrchestratorApi, NUMBER_OF_MODELS_TO_KEEP
from label_sleuth.training_set_selector.training_set_selector_factory import TrainingSetSelectionFactory


def add_random_labels_to_document(doc: Document, min_num_sentences_to_label: int, categories, seed=0):
    random.seed(seed)
    text_elements_to_label = random.sample(doc.text_elements, min(min_num_sentences_to_label, len(doc.text_elements)))
    text_elements_to_label = [LabeledTextElement(**vars(text_element)) for text_element in text_elements_to_label]
    for elem in text_elements_to_label:
        categories_to_label = random.sample(categories, random.randint(0, len(categories)))
        elem.category_to_label.update({cat: Label(label=random.sample([LABEL_POSITIVE, LABEL_NEGATIVE], 1)[0])
                                       for cat in categories_to_label})
    return text_elements_to_label

def add_random_multiclass_labels_to_document(doc: Document, min_num_sentences_to_label: int, categories: List[int],
                                             seed=0):
    random.seed(seed)
    text_elements_to_label = random.sample(doc.text_elements, min(min_num_sentences_to_label, len(doc.text_elements)))
    text_elements_to_label = [MulticlassLabeledTextElement(**vars(text_element)) for text_element in text_elements_to_label]
    for elem in text_elements_to_label:
        elem.label = MulticlassLabel(random.randint(0, len(categories)-1))
    return text_elements_to_label


class TestOrchestratorAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.TemporaryDirectory()
        config = load_config(os.path.abspath(os.path.join(
                __file__, 
                os.pardir,
                os.pardir,
                "config_for_tests.json"))
            )
        background_jobs_manager = BackgroundJobsManager(config.cpu_workers)
        cls.model_factory = ModelFactory(cls.temp_dir.name, background_jobs_manager, None)
        cls.active_learning_factory = ActiveLearningFactory()
        cls.data_access = FileBasedDataAccess(os.path.join(cls.temp_dir.name, "output"), 60)
        cls.orchestrator_state = OrchestratorStateApi(os.path.join(cls.temp_dir.name, "output", "workspaces"))
        cls.training_set_selection_factory = TrainingSetSelectionFactory(cls.data_access, background_jobs_manager)
        cls.orchestrator_api = OrchestratorApi(cls.orchestrator_state, cls.data_access, cls.active_learning_factory,
                                               cls.model_factory, cls.training_set_selection_factory,
                                               background_jobs_manager,
                                               None,  # no need to use sentence embedding,
                                               config)

    @classmethod
    def tearDownClass(cls):
        cls.temp_dir.cleanup()

    @patch.object(OrchestratorApi, 'set_labels')
    def test_import_category_labels(self, mock_set_labels):
        workspace_id = self.test_import_category_labels.__name__
        dataset_name = f'{workspace_id}_dump'
        categories = [f'{workspace_id}_cat_' + str(i) for i in range(8)]

        # create mock dataframe to be imported
        docs = generate_corpus(self.data_access, dataset_name, 5)
        self.orchestrator_api.create_workspace(workspace_id=workspace_id, dataset_name=dataset_name)
        elements_for_import = []
        for doc in docs:
            elements_for_import.extend(
                add_random_labels_to_document(doc, 1, categories))
        categories_with_labels = {cat for e in elements_for_import for cat in e.category_to_label.keys()}
        dicts_for_import = [{DisplayFields.uri: e.uri, DisplayFields.text: e.text, DisplayFields.category_name: cat,
                             DisplayFields.label: e.category_to_label[cat].label,
                             DisplayFields.label_type: e.category_to_label[cat].label_type.name}
                            for e in elements_for_import for cat in e.category_to_label.keys()
                            if len(e.category_to_label) > 0]
        df_for_import = pd.DataFrame(dicts_for_import)

        # create only one of the categories
        selected_cat1 = next(iter(categories_with_labels))
        category_id1 = self.orchestrator_api.create_new_category(workspace_id, selected_cat1, 'description')
        category_id_to_name = {category_id1: selected_cat1}

        def create_cat_id(ws, cat_name, desc):
            cat_id = len(category_id_to_name)+1
            category_id_to_name[cat_id] = cat_name
            return cat_id

        # call import_labels()
        with patch.object(OrchestratorApi, 'create_new_category') as mock_create_new_category:
            mock_create_new_category.side_effect = create_cat_id
            info_dict = self.orchestrator_api.import_category_labels(workspace_id, df_for_import)

        self.assertEqual(len(info_dict['categories']), len(categories_with_labels))

        # check the correct number of categories are being created
        self.assertEqual(mock_create_new_category.call_count, len(categories_with_labels) - 1)
        self.assertEqual(len(info_dict['categoriesCreated']), len(categories_with_labels) - 1)

        # check that the correct label info was sent to set_labels()
        label_dicts_sent = [set_labels_call.args[1] for set_labels_call in mock_set_labels.call_args_list]
        uris_imported = {d[DisplayFields.uri] for d in dicts_for_import}
        uris_sent = {uri for d in label_dicts_sent for uri in d.keys()}
        self.assertEqual(uris_imported, uris_sent)

        self.assertEqual(info_dict['total'], len(df_for_import))

        # check that all the (uri, category_name, label) combinations indeed came from the imported dataframe
        label_tuples_imported = \
            set(df_for_import[[DisplayFields.uri, DisplayFields.category_name, DisplayFields.label]].itertuples(
                name=None, index=False))
        label_tuples_sent = set()
        for d in label_dicts_sent:
            for uri, cat_to_label in d.items():
                for cat_id, label_obj in cat_to_label.items():
                    label_tuples_sent.add((uri, category_id_to_name[cat_id], label_obj.label))
        self.assertEqual(label_tuples_imported, label_tuples_sent)

    def test_export_and_import_workspace_labels(self):
        dataset_name = self.test_export_and_import_workspace_labels.__name__ + '_dump'
        doc = generate_corpus(self.data_access, dataset_name)[0]
        categories = ['cat_' + str(i) for i in range(3)]

        self.orchestrator_api.create_workspace(workspace_id='mock_workspace_1', dataset_name=dataset_name)
        category_ids = []
        for cat in categories:
            category_id = self.orchestrator_api.create_new_category('mock_workspace_1', cat, 'some_description')
            category_ids.append(category_id)
        labeled_elements_for_export = add_random_labels_to_document(doc, 5, category_ids)
        labeled_elements_for_export = [e for e in labeled_elements_for_export if e.category_to_label != {}]

        def mock_get_labeled_text_elements(wid, ds, category_id, *args, **kwargs):
            return {'results': [e for e in labeled_elements_for_export if category_id in e.category_to_label]}

        # use export_workspace_labels() to turn labeled_elements_for_export into a dataframe for export
        with patch.object(FileBasedDataAccess, 'get_labeled_text_elements', side_effect=mock_get_labeled_text_elements):
            exported_df = self.orchestrator_api.export_workspace_labels('mock_workspace_1', True)
            exported_df = exported_df.astype({'label_metadata': 'str'})

        for column in exported_df.columns:
            self.assertIn(column, DisplayFields.__dict__.values())

        # import the resulting dataframe using import_category_labels()
        self.orchestrator_api.create_workspace(workspace_id='mock_workspace_2', dataset_name=dataset_name)
        self.orchestrator_api.import_category_labels('mock_workspace_2', exported_df)

        unique = set()
        labeled_elements_imported = \
            [element for cat_id in category_ids for element
             in self.orchestrator_api.get_all_labeled_text_elements('mock_workspace_2', dataset_name, cat_id)
             if element.uri not in unique and not unique.add(element.uri)]

        self.assertEqual(sorted(labeled_elements_for_export, key=lambda te: te.uri),
                         sorted(labeled_elements_imported, key=lambda te: te.uri))

    def test_multiclass_export_and_import_workspace_labels(self):
        dataset_name = self.test_multiclass_export_and_import_workspace_labels.__name__ + '_dump'
        doc = generate_corpus(self.data_access, dataset_name,num_additional_texts_for_each_doc=50)[0]
        categories = {'cat_' + str(i):[f"description of category {str(i)}", "#000000"] for i in range(3)}
        mock_workspace = "multiclass_workspace"
        self.orchestrator_api.create_workspace(workspace_id=mock_workspace, dataset_name=dataset_name,
                                               workspace_type=WorkspaceModelType.MultiClass)

        for cat_name, cat_info in categories.items():
            self.orchestrator_api.create_new_category(mock_workspace, cat_name, cat_info[0], cat_info[1])
        labeled_elements_for_export = add_random_multiclass_labels_to_document(doc, 30, categories.keys())
        labeled_elements_for_export = [e for e in labeled_elements_for_export if e.label is not None]



        def mock_get_labeled_text_elements(wid, ds, category_id, *args, **kwargs):
            return {'results': labeled_elements_for_export}

        # use export_workspace_labels() to turn labeled_elements_for_export into a dataframe for export
        with patch.object(FileBasedDataAccess, 'get_labeled_text_elements', side_effect=mock_get_labeled_text_elements):
            exported_df = self.orchestrator_api.export_workspace_labels(mock_workspace, True)
            exported_df = exported_df.astype({'label_metadata': 'str'})

        for column in exported_df.columns:
            self.assertIn(column, DisplayFields.__dict__.values())

        # import the resulting dataframe using import_category_labels()
        mock_workspace_2 = 'multiclass_workspace_2'
        self.orchestrator_api.create_workspace(workspace_id=mock_workspace_2, dataset_name=dataset_name,
                                               workspace_type=WorkspaceModelType.MultiClass)
        res = self.orchestrator_api.import_category_labels(mock_workspace_2, exported_df)

        unique = set()
        labeled_elements_imported = \
            [element for element
             in self.orchestrator_api.get_all_labeled_text_elements(mock_workspace_2, dataset_name, None)
             if element.uri not in unique and not unique.add(element.uri)]
        categories_ws1 = self.orchestrator_api.get_all_categories(mock_workspace)
        for text_element in labeled_elements_for_export:
            text_element.label = categories_ws1[text_element.label.label].name

        categories_ws2 = self.orchestrator_api.get_all_categories(mock_workspace_2)
        for text_element in labeled_elements_imported:
            text_element.label = categories_ws2[text_element.label.label].name
        self.assertEqual(sorted(labeled_elements_for_export, key=lambda te: te.uri),
                         sorted(labeled_elements_imported, key=lambda te: te.uri))

    def test_multiclass_import_with_existing_categories(self):
        dataset_name = self.test_multiclass_import_with_existing_categories.__name__ + '_dump'
        doc = generate_corpus(self.data_access, dataset_name,num_additional_texts_for_each_doc=50)[0]
        categories = {'cat_' + str(i):[f"description of category {str(i)}","#000000"] for i in range(3)}
        mock_workspace = "test_multiclass_import_with_existing_categories"
        self.orchestrator_api.create_workspace(workspace_id=mock_workspace, dataset_name=dataset_name,
                                               workspace_type=WorkspaceModelType.MultiClass)

        for cat_name, cat_info in categories.items():
            self.orchestrator_api.create_new_category(mock_workspace, cat_name, cat_info[0], cat_info[1])
        self.orchestrator_api.set_labels(mock_workspace,{doc.text_elements[0].uri:MulticlassLabel(0)})
        self.orchestrator_api.set_labels(mock_workspace, {doc.text_elements[1].uri: MulticlassLabel(1)})

        self.assertEqual({0: MulticlassCategory(name='cat_0', id=0, description='description of category 0',
                                                color="#000000"),
                          1: MulticlassCategory(name='cat_1', id=1, description='description of category 1'
                                                ,color="#000000"),
                          2: MulticlassCategory(name='cat_2', id=2, description='description of category 2'
                                                ,color="#000000")},
                         self.orchestrator_api.get_all_categories(mock_workspace))
        additional_labels_df = pd.DataFrame([{"text":doc.text_elements[2].text,"label":"cat_1"},
                                             {"text":doc.text_elements[3].text,"label":"new category created by import"}])
        self.orchestrator_api.import_category_labels(mock_workspace, additional_labels_df)

        self.assertEqual({0: MulticlassCategory(name='cat_0', id=0, description='description of category 0',
                                                color="#000000"),
                          1: MulticlassCategory(name='cat_1', id=1, description='description of category 1',
                                                color="#000000"),
                          2: MulticlassCategory(name='cat_2', id=2, description='description of category 2',
                                                color="#000000"),
                          3: MulticlassCategory(name='new category created by import', id=3, description='',
                                                color=None)},
                         self.orchestrator_api.get_all_categories(mock_workspace))

        labeled_text_elements =  self.orchestrator_api.get_all_labeled_text_elements(mock_workspace, dataset_name,
                                                                                     category_id=None)
        self.assertEqual(1,len([x.label for x in labeled_text_elements if x.label.label==3]),
                         msg="imported element was not found")
        self.assertEqual(1, len([x.label for x in labeled_text_elements if x.label.label == 0]),
                         msg="existing label disappeared")
        self.assertEqual(2, len([x.label for x in labeled_text_elements if x.label.label == 1]),
                         msg="existing label disappeared")
        self.assertEqual(0, len([x.label for x in labeled_text_elements if x.label.label == 2]), msg="unexpected label")

    @patch.object(OrchestratorApi, 'run_iteration')
    @patch.object(OrchestratorStateApi, 'get_label_change_count_since_last_train')
    @patch.object(FileBasedDataAccess, 'get_label_counts')
    def test_train_if_recommended(self, mock_get_label_counts, mock_get_label_change_count, mock_run_iteration):
        workspace_id = self.test_train_if_recommended.__name__
        dataset_name = f'{workspace_id}_dump'
        category_name = f'{workspace_id}_cat'
        generate_corpus(self.data_access, dataset_name)
        self.orchestrator_api.create_workspace(workspace_id, dataset_name)
        category_id = self.orchestrator_api.create_new_category(workspace_id, category_name, 'some_description')

        change_threshold = self.orchestrator_api.config.binary_flow.changed_element_threshold
        first_model_pos_threshold = self.orchestrator_api.config.binary_flow.first_model_positive_threshold

        # do not trigger training
        negative_count = 1
        positive_count = max(max(0, change_threshold - negative_count - 1),
                             max(0, first_model_pos_threshold - 1))

        label_counts = {LABEL_POSITIVE: positive_count, LABEL_NEGATIVE: negative_count}
        mock_get_label_counts.return_value = label_counts
        mock_get_label_change_count.return_value = sum(label_counts.values())

        progress = self.orchestrator_api.get_progress(workspace_id, dataset_name, category_id)
        self.assertEqual(progress['all'], 67)

        self.orchestrator_api.train_if_recommended(workspace_id, category_id)
        mock_run_iteration.assert_not_called()

        # trigger training
        positive_count = max(change_threshold, first_model_pos_threshold) - negative_count + 1
        label_counts = {LABEL_POSITIVE: positive_count, LABEL_NEGATIVE: negative_count}
        mock_get_label_counts.return_value = label_counts
        mock_get_label_change_count.return_value = sum(label_counts.values())

        progress = self.orchestrator_api.get_progress(workspace_id, dataset_name, category_id)
        self.assertEqual(progress['all'], 100)

        train_set_selector = \
            self.orchestrator_api.training_set_selection_factory.get_training_set_selector(
                self.orchestrator_api.config.binary_flow.training_set_selection_strategy).__class__
        with patch.object(train_set_selector, 'get_train_set'):
            self.orchestrator_api.train_if_recommended(workspace_id, category_id)
        mock_run_iteration.assert_called()

    @patch.object(OrchestratorApi, 'run_iteration')
    @patch.object(OrchestratorStateApi, 'get_label_change_count_since_last_train')
    @patch.object(FileBasedDataAccess, 'get_label_counts')
    def test_get_train_if_recommended_multiclass(self, mock_get_label_counts, mock_get_label_change_count,
                                                 mock_run_iteration):
        workspace_id = self.test_get_train_if_recommended_multiclass.__name__
        dataset_name = f'{workspace_id}_dump'
        generate_corpus(self.data_access, dataset_name)
        self.orchestrator_api.create_workspace(workspace_id, dataset_name, workspace_type=WorkspaceModelType.MultiClass)
        self.orchestrator_api.create_new_category(workspace_id, "cat1", "desc1", None)
        self.orchestrator_api.create_new_category(workspace_id, "cat2", "desc2", None)
        self.orchestrator_api.create_new_category(workspace_id, "cat3", "desc3", None)


        change_threshold = self.orchestrator_api.config.multiclass_flow.changed_element_threshold
        per_class_threshold = self.orchestrator_api.config.multiclass_flow.per_class_labeling_threshold

        # do not trigger training

        label_counts = {0: 1, 1: 1, 2: 0}
        mock_get_label_counts.return_value = label_counts
        mock_get_label_change_count.return_value = sum(label_counts.values())

        self.orchestrator_api.config.multiclass_flow.per_class_labeling_threshold = 1
        progress = self.orchestrator_api.get_progress(workspace_id, dataset_name, category_id=None)
        self.assertEqual(progress['all'], 67)

        self.orchestrator_api.train_if_recommended(workspace_id, None)
        mock_run_iteration.assert_not_called()

        label_counts = {0: 1, 1: 1, 2: 1}
        mock_get_label_counts.return_value = label_counts
        mock_get_label_change_count.return_value = sum(label_counts.values())

        progress = self.orchestrator_api.get_progress(workspace_id, dataset_name, category_id=None)
        self.assertEqual(progress['all'], 100)

        train_set_selector = \
            self.orchestrator_api.training_set_selection_factory.get_training_set_selector(
                self.orchestrator_api.config.multiclass_flow.training_set_selection_strategy).__class__
        with patch.object(train_set_selector, 'get_train_set'):
            self.orchestrator_api.train_if_recommended(workspace_id, None)
        mock_run_iteration.assert_called()

    @patch.object(OrchestratorStateApi, 'get_label_change_count_since_last_train')
    @patch.object(FileBasedDataAccess, 'get_label_counts')
    def test_get_progress_multiclass(self, mock_get_label_counts, mock_get_label_change_count):
        workspace_id = self.test_get_progress_multiclass.__name__
        dataset_name = f'{workspace_id}_dump'
        category_name = f'{workspace_id}_cat'
        generate_corpus(self.data_access, dataset_name)
        self.orchestrator_api.create_workspace(workspace_id, dataset_name, workspace_type=WorkspaceModelType.MultiClass)
        self.orchestrator_api.create_new_category(workspace_id, "cat1", "desc1", None)
        self.orchestrator_api.create_new_category(workspace_id, "cat2", "desc2", None)
        self.orchestrator_api.create_new_category(workspace_id, "cat3", "desc3", None)

        change_threshold = self.orchestrator_api.config.multiclass_flow.changed_element_threshold
        per_class_threshold = self.orchestrator_api.config.multiclass_flow.per_class_labeling_threshold

        # do not trigger training

        label_counts = {0: 1, 1: 1, 2: 0}
        mock_get_label_counts.return_value = label_counts
        mock_get_label_change_count.return_value = sum(label_counts.values())

        progress = self.orchestrator_api.get_progress(workspace_id, dataset_name, category_id=None)
        self.assertEqual(progress['all'], 67)

        label_counts = {0: 1, 1: 1, 2: 0}
        mock_get_label_counts.return_value = label_counts
        mock_get_label_change_count.return_value = sum(label_counts.values())

        self.orchestrator_api.config.multiclass_flow.per_class_labeling_threshold = 2
        progress = self.orchestrator_api.get_progress(workspace_id, dataset_name, category_id=None)
        self.assertEqual(progress['all'], 33)

        label_counts = {0: 100, 1: 1, 2: 0}
        mock_get_label_counts.return_value = label_counts
        mock_get_label_change_count.return_value = sum(label_counts.values())
        progress = self.orchestrator_api.get_progress(workspace_id, dataset_name, category_id=None)
        self.assertEqual(progress['all'], 50)

        label_counts = {0: 1, 1: 2, 2: 1}
        mock_get_label_counts.return_value = label_counts
        mock_get_label_change_count.return_value = sum(label_counts.values())
        progress = self.orchestrator_api.get_progress(workspace_id, dataset_name, category_id=None)
        self.assertEqual(progress['all'], 67)

        label_counts = {0: 0, 1: 0, 2: 0}
        mock_get_label_counts.return_value = label_counts
        mock_get_label_change_count.return_value = sum(label_counts.values())
        progress = self.orchestrator_api.get_progress(workspace_id, dataset_name, category_id=None)
        self.assertEqual(progress['all'], 0)

        label_counts = {0: 2, 1: 3, 2: 3}
        mock_get_label_counts.return_value = label_counts
        mock_get_label_change_count.return_value = sum(label_counts.values())
        progress = self.orchestrator_api.get_progress(workspace_id, dataset_name, category_id=None)
        self.assertEqual(progress['all'], 100)

        label_counts = {0: 2, 1: 3, 2: 3}
        mock_get_label_counts.return_value = label_counts
        mock_get_label_change_count.return_value = 1
        progress = self.orchestrator_api.get_progress(workspace_id, dataset_name, category_id=None)
        self.assertEqual(progress['all'], 50)

    def test_set_label_increases_change_count(self):
        workspace_id = self.test_set_label_increases_change_count.__name__
        dataset_name = f'{workspace_id}_dump'
        category_name = f'{workspace_id}_cat'
        generate_corpus(self.data_access, dataset_name)
        self.orchestrator_api.create_workspace(workspace_id, dataset_name)
        category_id = self.orchestrator_api.create_new_category(workspace_id, category_name, 'some_description')
        text_elements = self.orchestrator_api.get_all_text_elements(dataset_name)
        self.orchestrator_api.set_labels(workspace_id, {text_elements[0].uri: {category_id: Label(LABEL_POSITIVE)}})
        num_changed = self.orchestrator_state.get_label_change_count_since_last_train(workspace_id, category_id)
        self.assertEqual(1, num_changed, msg="we set a label for one element")
        self.orchestrator_api.set_labels(workspace_id, {text_elements[0].uri: {category_id: Label(LABEL_POSITIVE)}})
        num_changed = self.orchestrator_state.get_label_change_count_since_last_train(workspace_id, category_id)
        self.assertEqual(2, num_changed, msg="we set a label for "
                                             "one element (same element should increase the change count)")

    def test_set_label_without_increasing_change_count(self):
        workspace_id = self.test_set_label_without_increasing_change_count.__name__
        dataset_name = f'{workspace_id}_dump'
        category_name = f'{workspace_id}_cat'
        generate_corpus(self.data_access, dataset_name)
        self.orchestrator_api.create_workspace(workspace_id, dataset_name)
        category_id = self.orchestrator_api.create_new_category(workspace_id, category_name, 'some_description')
        text_elements = self.orchestrator_api.get_all_text_elements(dataset_name)
        self.orchestrator_api.set_labels(workspace_id, {text_elements[0].uri: {category_id: Label(LABEL_POSITIVE)}},
                                         update_label_counter=False)
        num_changed = self.orchestrator_state.get_label_change_count_since_last_train(workspace_id, category_id)
        self.assertEqual(0, num_changed, msg="we set a label with update_label_counter=False "
                                             "so number of changed element should be zero")

    @patch.object(OrchestratorApi, 'delete_iteration_model')
    @patch.object(OrchestratorStateApi, 'get_all_iterations')
    def test_old_models_deletion(self, get_all_iterations, delete_iteration_model):
        workspace_id = self.test_old_models_deletion.__name__
        dataset_name = f'{workspace_id}_dump'
        category_name = f'{workspace_id}_cat'
        generate_corpus(self.data_access, dataset_name)
        self.orchestrator_api.create_workspace(workspace_id, dataset_name)
        category_id = self.orchestrator_api.create_new_category(workspace_id, category_name, 'some_description')
        get_all_iterations.return_value = \
            [Iteration(IterationStatus.READY, ModelInfo("x", ModelStatus.READY, datetime.now(), ModelsCatalog.RAND, {}),
                       {}, [])] * (NUMBER_OF_MODELS_TO_KEEP+1)
        self.orchestrator_api._delete_old_models(workspace_id, category_id, NUMBER_OF_MODELS_TO_KEEP-1)

        # _delete_old_models for iteration NUMBER_OF_MODELS_TO_KEEP-1 should not delete any model as there are
        # only NUMBER_OF_MODELS_TO_KEEP iterations in status READY
        delete_iteration_model.assert_not_called()

        self.orchestrator_api._delete_old_models(workspace_id, category_id, NUMBER_OF_MODELS_TO_KEEP)

        # _delete_old_models for iteration NUMBER_OF_MODELS_TO_KEEP should invoke delete_iteration_model for iteration 0
        delete_iteration_model.assert_called_with(workspace_id, category_id, 0)
