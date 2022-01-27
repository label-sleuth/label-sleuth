import os

from lrtc_lib.active_learning.core.active_learning_factory import ActiveLearningFactory
from lrtc_lib.models.core.models_factory import ModelFactory

INFER_CACHE_SIZE = 5000000
ROOT_DIR = os.path.abspath(os.path.join(os.path.abspath(__file__), os.pardir))

WORKSPACE_DATA_DIR = os.path.normpath(os.path.join(ROOT_DIR, "output/workspaces"))
if not os.path.exists(WORKSPACE_DATA_DIR):
    os.makedirs(WORKSPACE_DATA_DIR)

MODEL_FACTORY = ModelFactory()
ACTIVE_LEARNING_FACTORY = ActiveLearningFactory()







