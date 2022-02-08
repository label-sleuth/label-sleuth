import random
import unittest

from lrtc_lib.active_learning.core.active_learning_factory import ActiveLearningFactory
from lrtc_lib.active_learning.core.active_learning_strategies import ActiveLearningStrategies
from lrtc_lib.data_access.core.utils import URI_SEP
from lrtc_lib.data_access.core.data_structs import Document, TextElement, Label, LABEL_NEGATIVE
import lrtc_lib.data_access.single_dataset_loader as ds_loader
from lrtc_lib.orchestrator import orchestrator_api
from lrtc_lib.models.core.model_types import ModelTypes


def generate_simple_doc(dataset_name, category_name, doc_id=0):
    sentences = ['Document Title is Super Interesting', 'First sentence is not that attractive.',
                 'The second one is a bit better.', 'Last sentence offers a promising view for the future!']
    sentences = [f'{s}_{random.random()}' for s in sentences]
    text_elements = []
    start_span = 0
    for idx, sentence in enumerate(sentences):
        end_span = start_span + len(sentence)
        mock_label = {category_name: Label(LABEL_NEGATIVE)}
        text_elements.append(TextElement(uri=URI_SEP.join([dataset_name, str(doc_id), str(idx)]), text=sentence,
                                         span=[(start_span, end_span)], metadata={}, category_to_label=mock_label))
        start_span = end_span + 1

    doc = Document(uri=dataset_name + URI_SEP + str(doc_id), text_elements=text_elements, metadata={})
    return doc


def prepare_workspace_with_trained_model(workspace_id):
    orchestrator_api.delete_workspace(workspace_id, ignore_errors=True)
    dataset_name = 'ds'
    category_name = f'cat_{random.random()}'
    ds_loader.delete_dataset(dataset_name)
    docs = [generate_simple_doc(dataset_name, category_name, i) for i in range(200)]
    orchestrator_api.add_documents(dataset_name, docs)
    orchestrator_api.create_workspace(workspace_id=workspace_id, dataset_name=dataset_name)
    orchestrator_api.create_new_category(workspace_id, category_name, '')
    orchestrator_api.train(workspace_id, category_name, ModelTypes.RAND, docs[0].text_elements, None)
    return dataset_name, category_name


class TestActiveLearningStrategies(unittest.TestCase):
    def test_random_reproducibility(self):
        workspace_id = self.test_random_reproducibility.__name__
        ds, cat = prepare_workspace_with_trained_model(workspace_id)
        al = ActiveLearningFactory().get_active_learner(ActiveLearningStrategies.RANDOM)

        batch1 = al.get_recommended_items_for_labeling(workspace_id, None, ds, cat, 50)
        batch1_uris = [e.uri for e in batch1]

        workspace_id2 = self.test_random_reproducibility.__name__+'b'
        ds, cat2 = prepare_workspace_with_trained_model(workspace_id2)
        batch2 = al.get_recommended_items_for_labeling(workspace_id2, None, ds, cat2, 50)
        batch2_uris = [e.uri for e in batch2]

        self.assertEqual(batch1_uris, batch2_uris)

        orchestrator_api.delete_workspace(workspace_id, ignore_errors=True)
        ds_loader.delete_dataset(ds)

    def test_hard_mining(self):
        workspace_id = self.test_hard_mining.__name__
        ds, cat = prepare_workspace_with_trained_model(workspace_id)
        al = ActiveLearningFactory().get_active_learner(ActiveLearningStrategies.HARD_MINING)
        sample_size = 50
        batch = al.get_recommended_items_for_labeling(workspace_id, None, ds, cat, sample_size)
        batch_uris = [e.uri for e in batch]

        unlabeled = al.get_unlabeled_data(workspace_id, ds, cat, 10**6)
        random_model_scores = orchestrator_api.infer(workspace_id, cat, unlabeled)['scores']
        confidence_scores = [(abs(scores[0]-0.5), i) for i, scores in enumerate(random_model_scores)]
        uris_by_least_confidence = [unlabeled[i].uri for s, i in sorted(confidence_scores, key=lambda x: x[0])]

        self.assertEqual(uris_by_least_confidence[:sample_size], batch_uris)

        orchestrator_api.delete_workspace(workspace_id, ignore_errors=True)
        ds_loader.delete_dataset(ds)

    def test_retrospective(self):
        workspace_id = self.test_retrospective.__name__
        ds, cat = prepare_workspace_with_trained_model(workspace_id)
        al = ActiveLearningFactory().get_active_learner(ActiveLearningStrategies.RETROSPECTIVE)
        sample_size = 50
        batch = al.get_recommended_items_for_labeling(workspace_id, None, ds, cat, sample_size)
        batch_uris = [e.uri for e in batch]

        unlabeled = al.get_unlabeled_data(workspace_id, ds, cat, 10**6)
        random_model_scores = orchestrator_api.infer(workspace_id, cat, unlabeled)['scores']
        pos_scores = [(scores[1], i) for i, scores in enumerate(random_model_scores)]
        uris_by_pos_score = [unlabeled[i].uri for s, i in sorted(pos_scores, key=lambda x: x[0], reverse=True)]

        self.assertEqual(uris_by_pos_score[:sample_size], batch_uris)

        orchestrator_api.delete_workspace(workspace_id, ignore_errors=True)
        ds_loader.delete_dataset(ds)
