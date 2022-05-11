import os
from lrtc_lib.active_learning.core.active_learning_factory import ActiveLearningFactory
from lrtc_lib.data_access.file_based.file_based_data_access import FileBasedDataAccess
from lrtc_lib.definitions import ROOT_DIR
from lrtc_lib.models.core.models_factory import ModelFactory
from lrtc_lib.models.core.models_background_jobs_manager import ModelsBackgroundJobsManager
from lrtc_lib.orchestrator.core.state_api.orchestrator_state_api import OrchestratorStateApi

MODEL_FACTORY = ModelFactory(ModelsBackgroundJobsManager())
ACTIVE_LEARNING_FACTORY = ActiveLearningFactory()
DATA_ACCESS = FileBasedDataAccess(os.path.join(ROOT_DIR,"output"))
ORCHESTRATOR_STATE_API = OrchestratorStateApi(os.path.join(ROOT_DIR,"output","workspaces"))