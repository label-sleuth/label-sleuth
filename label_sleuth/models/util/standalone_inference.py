import os
import tempfile

import jsonpickle

from label_sleuth.models.core.model_api import ModelAPI
from label_sleuth.models.core.models_factory import ModelFactory
from label_sleuth.models.core.tools import SentenceEmbeddingService
from label_sleuth.orchestrator.background_jobs_manager import BackgroundJobsManager


def get_model_api(model_path: str, sentence_embedding_model_path=os.getcwd()) -> ModelAPI:
    """
    Get an instance of ModelAPI according to the provided model_type
    For external use only, do not use inside sleuth project.

    :param model_path: directory of exported model, used for reading the model type
    :param sentence_embedding_model_path: Where to save sentence embedding model if
                                          used by the model type. Defaults to os.getcwd().
    """
    model_info_path = os.path.join(model_path, "model_info.json")
    with open(model_info_path) as json_file:
        model_info = json_file.read()
    model_info = jsonpickle.decode(model_info)
    model_factory = ModelFactory(output_dir=tempfile.gettempdir(),
                                 background_jobs_manager=BackgroundJobsManager(),
                                 sentence_embedding_service=SentenceEmbeddingService(
                                     embedding_model_dir=sentence_embedding_model_path))
    return model_factory.get_model_api(model_info["model_type"])

