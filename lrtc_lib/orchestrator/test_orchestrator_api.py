# (c) Copyright IBM Corporation 2020.

# LICENSE: Apache License 2.0 (Apache-2.0)
# http://www.apache.org/licenses/LICENSE-2.0

import unittest

from lrtc_lib.data_access import single_dataset_loader
from lrtc_lib.data_access.core.data_structs import Label, TextElement, Document
from lrtc_lib.orchestrator import orchestrator_api
from lrtc_lib.data_access.core.data_structs import LABEL_POSITIVE, LABEL_NEGATIVE
from lrtc_lib.data_access.core.utils import URI_SEP


def generate_simple_doc(dataset_name, doc_id=0):
    sentences = ['with label true', 'with label false', 'no label']
    text_elements = []
    start_span = 0
    for idx, sentence in enumerate(sentences):
        end_span = start_span + len(sentence)
        text_elements.append(
            TextElement(uri=URI_SEP.join([dataset_name, str(doc_id), str(idx)]), text=sentence,
                        span=[(start_span, end_span)], metadata={}, category_to_label={}))
        start_span = end_span + 1

    doc = Document(uri=dataset_name + URI_SEP + str(doc_id), text_elements=text_elements, metadata={})
    return doc


class TestOrchestratorAPI(unittest.TestCase):
    def test_copy_existing_workspace_with_labeled_data(self):
        try:
            workspace_id = "wd_id"
            new_workspace_id = "new_" + workspace_id
            orchestrator_api.delete_workspace(workspace_id, ignore_errors=True)
            orchestrator_api.delete_workspace(workspace_id, ignore_errors=True)
            dataset_name = "ds_name"
            cat_name = "cat_name"
            cat_desc = "cat_desc"
            document = generate_simple_doc(dataset_name)
            orchestrator_api.add_documents(dataset_name, [document])
            orchestrator_api.create_workspace(workspace_id, dataset_name)
            orchestrator_api.create_new_category(workspace_id, cat_name, cat_desc)
            # List[(str,mapping(str,Label))]
            uri1 = document.text_elements[0].uri
            uri2 = document.text_elements[1].uri
            labels = [(uri1, {cat_name: Label(LABEL_POSITIVE, {})}), (uri2, {cat_name: Label(LABEL_NEGATIVE, {})})]
            orchestrator_api.set_labels(workspace_id, labels)

            orchestrator_api.copy_workspace(workspace_id, new_workspace_id)
            results_original = orchestrator_api.query(workspace_id=workspace_id, dataset_name=dataset_name,
                                                      category_name=cat_name,
                                                      query="with label", unlabeled_only=False, sample_size=10)
            results_new = orchestrator_api.query(workspace_id=new_workspace_id, dataset_name=dataset_name,
                                                 category_name=cat_name,
                                                 query="with label", unlabeled_only=False, sample_size=10)

            self.assertEqual(results_original["results"], results_new["results"])

            labels = [(uri1, {cat_name: Label(LABEL_NEGATIVE, {})}), (uri2, {cat_name: Label(LABEL_POSITIVE, {})})]
            orchestrator_api.set_labels(new_workspace_id, labels)
            results_new = orchestrator_api.query(workspace_id=new_workspace_id, dataset_name=dataset_name,
                                                 category_name=cat_name,
                                                 query="with label", unlabeled_only=False, sample_size=10)
            self.assertNotEqual(results_original["results"], results_new["results"])
        finally:
            orchestrator_api.delete_workspace(workspace_id, ignore_errors=True)
            orchestrator_api.delete_workspace(new_workspace_id, ignore_errors=True)
            single_dataset_loader.clear_all_saved_files(dataset_name)
