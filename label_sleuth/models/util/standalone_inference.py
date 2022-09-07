import os
import tempfile

from label_sleuth.models.core.catalog import ModelsCatalog
from label_sleuth.models.core.model_api import ModelAPI
from label_sleuth.models.core.model_type import ModelType
from label_sleuth.models.core.models_background_jobs_manager import ModelsBackgroundJobsManager
from label_sleuth.models.core.models_factory import ModelFactory
from label_sleuth.models.core.tools import SentenceEmbeddingService



def get_model_api(model_type: ModelType, sentence_embedding_model_path=os.getcwd()) -> ModelAPI:
    """
    Get an instance of ModelAPI according to the provided model_type
    For external use only, do not use inside sleuth project.

    :param model_type: a model type from the ModelsCatalog
    :param sentence_embedding_model_path: Where to save sentence embedding model if
                                          used by the model type. Defaults to os.getcwd().
    """
    model_factory = ModelFactory(output_dir=tempfile.gettempdir(),
                                 models_background_jobs_manager=ModelsBackgroundJobsManager(),
                                 sentence_embedding_service=SentenceEmbeddingService(
                                     embedding_model_dir=sentence_embedding_model_path))
    return model_factory.get_model_api(model_type)
