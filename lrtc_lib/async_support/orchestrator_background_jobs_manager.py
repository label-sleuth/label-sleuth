import threading
import time

from lrtc_lib.definitions import MODEL_FACTORY
from lrtc_lib.models.core.model_api import ModelStatus
from lrtc_lib.orchestrator.core.state_api import orchestrator_state_api
import logging
import traceback

from lrtc_lib.orchestrator.core.state_api.orchestrator_state_api import IterationStatus

WAIT_TIME_BETWEEN_STATUS_CHECK = 10


def start_orchestrator_background_job_manager(update_recommendation_func, post_train_method, on_ready):
    thread = threading.Thread(target=run, args=(update_recommendation_func, post_train_method, on_ready))
    thread.daemon = True  # Daemonize thread
    logging.info("Starting orchestrator background job manager")
    thread.start()  # Start the execution

# ModelAPI add a new model that starts training to a "models_in_train" list
# Background job check every x second the status of each model in this list, if changed,
# invoke in background, one method, that will run 1. post_train_method(infer+model prediction statistics)
# 2. calculate active learning for 1000 elements. 3. delete old models


def run(update_recommendation_func, post_train_method, post_active_learning_func):  # TODO we should get the current instance in a different way
    """ Method that runs forever """
    logging.info(f"Getting latest status from all workspaces every {WAIT_TIME_BETWEEN_STATUS_CHECK} seconds")
    while True:
        # Do something
        try:
            all_workspaces = orchestrator_state_api.get_all_workspaces()
            sample_size = 1000

            for workspace in all_workspaces:
                logging.debug("workspace status:%s" % workspace)
                for category_name, category in workspace.categories.items():  # TODO shouldn't return empty
                    for iteration_index, iteration in enumerate(category.active_learning_iterations):  # TODO ensure only updating the recommendations for the *latest* model
                        model = iteration.model
                        if model.model_status == ModelStatus.TRAINING:
                            train_and_infer_api = MODEL_FACTORY.get_model(model.model_type)
                            latest_model_status = train_and_infer_api.get_model_status(model.model_id)
                            logging.debug(f"orchestrator latest logging status for model_id {model.model_id} "
                                          f"from train_and_infer_api: {latest_model_status}")
                            prev_model_status = model.model_status
                            if prev_model_status != latest_model_status:
                                orchestrator_state_api.update_model_state(workspace_id=workspace.workspace_id,
                                                                          category_name=category_name,
                                                                          iteration_index=iteration_index,
                                                                          new_status=latest_model_status)
                            if prev_model_status == ModelStatus.TRAINING and latest_model_status == ModelStatus.READY:
                                logging.info(f"model id {model.model_id} ({model.model_type.name}) "
                                             f"changed status from TRAINING to READY, updating AL recommendations")
                                orchestrator_state_api.update_iteration_status(workspace.workspace_id, category_name, iteration_index,
                                                                               new_status=IterationStatus.RUNNING_INFERENCE)
                                post_train_method(workspace.workspace_id, category_name, iteration_index)
                                orchestrator_state_api.update_iteration_status(workspace.workspace_id, category_name, iteration_index,
                                                                               new_status=IterationStatus.RUNNING_ACTIVE_LEARNING)
                                update_recommendation_func(workspace.workspace_id, workspace.dataset_name,
                                                           category_name, sample_size, iteration_index)
                                post_active_learning_func(workspace.workspace_id, category_name, iteration_index)
                                orchestrator_state_api.update_iteration_status(workspace.workspace_id, category_name, iteration_index,
                                                                               new_status=IterationStatus.READY)

        except Exception as e:
            logging.critical(f"Error in background manager {e}")
            traceback.print_exc()
        time.sleep(WAIT_TIME_BETWEEN_STATUS_CHECK)
