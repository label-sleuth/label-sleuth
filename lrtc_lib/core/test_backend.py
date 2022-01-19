import unittest
from lrtc_lib.core import backend
from lrtc_lib import definitions
from lrtc_lib.data_access.core.data_structs import Label
from lrtc_lib.training_set_selector.train_and_dev_set_selector_api import TrainingSetSelectionStrategy


class TestEndToEnd(unittest.TestCase):
    def test_end_to_end(self):
        try:
            definitions.PROJECT_PROPERTIES["training_set_selection"] = TrainingSetSelectionStrategy.ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_X2_RATIO
            WORKSPACE_ID = "TestCreateWorkspaceAndAddCategory"
            DATASET_NAME = "cnc_in_domain_train" # TODO create dummy dataset and use it
            CATEGORY_NAME = "test_category"
            CATEGORY_DESCRIPTION="description"
            NUM_PREDICTIONS = 10
            if (backend.workspace_exists(WORKSPACE_ID)):
                backend.delete_workspace(WORKSPACE_ID)
            backend.create_workspace(WORKSPACE_ID,DATASET_NAME)
            self.assertTrue(backend.workspace_exists(WORKSPACE_ID),msg="workspace not created")
            backend.create_new_category(WORKSPACE_ID,CATEGORY_NAME,CATEGORY_DESCRIPTION)
            self.assertEqual(backend.get_all_categories(WORKSPACE_ID),{CATEGORY_NAME:CATEGORY_DESCRIPTION},msg="category not created")
            query_results = \
            backend.query(WORKSPACE_ID, DATASET_NAME, CATEGORY_NAME, "warrant", unlabeled_only=True, sample_size=20,remove_duplicates=True)["results"]
            # set positives labels for all the queries sentences ("user's labels")
            uri_with_positive_label = [(x.uri, {CATEGORY_NAME: Label("true", {})}) for x in query_results]
            backend.set_labels(WORKSPACE_ID, uri_with_positive_label)

            first_model_pos_labels = backend.get_label_counts(WORKSPACE_ID, DATASET_NAME, CATEGORY_NAME)["true"]
            self.assertLessEqual(20, first_model_pos_labels,"no positive labels")

            model_id = backend.train_if_recommended(WORKSPACE_ID, CATEGORY_NAME)
            train_sizes = backend.get_model_train_counts(WORKSPACE_ID, model_id)
            self.assertIsNotNone(model_id, msg="Model was not trained (None model_id)")
            self.assertDictEqual({'true': 20, 'weak_false': 40},train_sizes)
            print("ListWorkspaces:"+str(backend.list_workspaces()))
            print("getWorkspaceInfo:" + str(backend.get_workspace_info(WORKSPACE_ID)))
            # get 10 random sentences from the dataset and predict their label
            sample = backend.get_all_text_elements(DATASET_NAME)[0:NUM_PREDICTIONS]
            predicted_label_by_latets = backend.infer(WORKSPACE_ID, CATEGORY_NAME, sample)["labels"]
            predicted_label_by_model_id = backend.infer(WORKSPACE_ID, CATEGORY_NAME, sample,model_id=model_id)["labels"]

            self.assertEqual(len(predicted_label_by_latets),NUM_PREDICTIONS,msg="received a different number of predictions than requested")
            self.assertEqual(predicted_label_by_latets, predicted_label_by_model_id,
                             msg="predictions by latest policy is different from the predictions by the only policy that was trained")
            sample_uris = [x.uri for x in sample]
            predicted_by_uris = backend.infer_by_uris(WORKSPACE_ID, CATEGORY_NAME, sample_uris,model_id=model_id)["labels"]
            self.assertEqual(predicted_label_by_model_id,predicted_by_uris,
                             msg="predictions by uris is different from the predictions by the trained policy")
            items_to_label = backend.get_elements_to_label(WORKSPACE_ID, CATEGORY_NAME, 10)
            uri_with_positive_label = [(x.uri, {CATEGORY_NAME: Label("true", {})}) for x in items_to_label]
            backend.set_labels(WORKSPACE_ID, uri_with_positive_label)

            # we expect more positive labels than in the previous policy
            self.assertLess(first_model_pos_labels,backend.get_label_counts(WORKSPACE_ID, DATASET_NAME, CATEGORY_NAME)["true"],
                               "AL suggestions were not added")
            model_id_by_al = backend.train_if_recommended(WORKSPACE_ID, CATEGORY_NAME)
            self.assertIsNotNone(model_id_by_al,"new policy by AL was not trained")

        finally:
            backend.delete_workspace(WORKSPACE_ID)