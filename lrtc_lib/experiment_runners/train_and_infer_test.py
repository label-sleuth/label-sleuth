import os
import logging

from lrtc_lib.models.core.model_types import ModelTypes
from lrtc_lib.experiment_runners.experiment_runners_core.assessment.evaluate_predictions import evaluate_predictions
from lrtc_lib.orchestrator.core.state_api.orchestrator_state_api import ActiveLearningRecommendationsStatus

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s')
from lrtc_lib.orchestrator import orchestrator_api

from lrtc_lib.oracle_data_access import oracle_data_access_api
from lrtc_lib.experiment_runners.experiment_runners_core.utils import get_output_dir

from lrtc_lib.orchestrator.orchestrator_api import LABEL_POSITIVE
from lrtc_lib.train_and_infer_service.train_and_infer_api import ModelStatus
import pandas as pd
import time


start_orchestrator_background_job_manager(orchestrator_api._update_recommendation, post_train_method=lambda *args: None,
                                          on_ready=lambda *args: None)


def train(workspace_id, dataset_name, category_name, model_type):
    logging.info("start training in workspace %s using dataset %s for category %s" % (workspace_id, dataset_name, category_name))
    orchestrator_api.create_workspace(workspace_id, dataset_name)
    orchestrator_api.create_new_category(workspace_id, category_name, 'fascinating new category')

    all_texts = orchestrator_api.get_all_text_elements(dataset_name)
    uris_to_label = [elem.uri for elem in all_texts][0:200]
    gold_labels = oracle_data_access_api.get_gold_labels(dataset_name=dataset_name, text_element_uris=uris_to_label)
    orchestrator_api.set_labels(workspace_id, gold_labels)

    train_and_dev_sets_selector = training_set_selector_factory.get_training_set_selector(
        selector=TrainingSetSelectionStrategyInternal.ALL_LABELED)
    train_data, dev_data = train_and_dev_sets_selector.get_train_and_dev_sets(
        workspace_id=workspace_id, train_dataset_name=dataset_name,
        category_name=category_name, dev_dataset_name=dataset_name.replace('_train', '_dev'))
    model_id = orchestrator_api.train(workspace_id, category_name, model_type, train_data, dev_data)
    assert model_id is not None, "train_model_if_recommended returned None - no model will be trained"
    status = orchestrator_api.get_model_status(workspace_id, model_id)
    logging.info(f"waiting for model {model_id} to complete training, current status:{status}")
    while status != ModelStatus.READY:
        #logging.info("waiting for model %s to complete training, current status:%s" % (model_id, status))
        status = orchestrator_api.get_model_status(workspace_id, model_id)
        time.sleep(2)
    logging.info("finished waiting for model %s, status is:%s" % (model_id, status))
    assert status==ModelStatus.READY,"model status is not READY"


def wait_and_print_al_recommendations(workspace_id, category_name):
    model_id = next(reversed(orchestrator_api.get_all_models_for_category(workspace_id, category_name)))
    al_status = orchestrator_api.get_model_active_learning_status(workspace_id, model_id)
    logging.info(f"al recommendations status is {al_status}")
    while al_status != ActiveLearningRecommendationsStatus.READY:
        al_status = orchestrator_api.get_model_active_learning_status(workspace_id, model_id)
        time.sleep(2)
    logging.info(f"al recommendations status CHANGED to {al_status}")
    elements_to_label = orchestrator_api.get_elements_to_label(workspace_id, category_name, 20)
    logging.info(f"elements to label ({len(elements_to_label)}):{elements_to_label}")


def infer_and_assess(workspace_id, dataset_name, category_name):
    all_texts = orchestrator_api.get_all_text_elements(dataset_name)
    all_text_elements_uris = [elem.uri for elem in all_texts]
    gold_labels = oracle_data_access_api.get_gold_labels(dataset_name=dataset_name,
                                                         text_element_uris=all_text_elements_uris)

    gold_category_labels = [sample_labels[category_name].labels for _, sample_labels in gold_labels]
    predicted_labels = orchestrator_api.infer(workspace_id, category_name, all_texts)

    evaluation = evaluate_predictions(gold_category_labels, predicted_labels,LABEL_POSITIVE)
    evaluation["dataset"]=dataset_name
    evaluation["category"]=category
    evaluation["dataset size"]=len(all_texts)
    return evaluation


if __name__ == '__main__':

    #workspace_id=str(randint(0,10000000000))
    all_results = []
    dataset = "trec_6"
    category = "LOC"

    logging.info(f"running dataset {dataset} with category {category}...")
    workspace_name = dataset+"_"+category+"_full_data_workspace"
    if orchestrator_api.workspace_exists(workspace_name):
        orchestrator_api.delete_workspace(workspace_id=workspace_name,ignore_errors=True)
    train(workspace_id=workspace_name, dataset_name=dataset + "_train", category_name=category,
          model_type=ModelTypes.WNLP_SVM_TF_IDF)
    wait_and_print_al_recommendations(workspace_name, category)
    evaluation_results = infer_and_assess(workspace_id=workspace_name, dataset_name=dataset + "_train",
                                          category_name=category)
    all_results.append(evaluation_results)

    results = pd.DataFrame(all_results)

    results.to_csv(os.path.join(get_output_dir(),f"{dataset}_{category}_full_train_evaluate_on_dev.csv"))

