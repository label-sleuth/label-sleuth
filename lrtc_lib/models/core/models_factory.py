import logging

from lrtc_lib.models.core.model_api import ModelAPI
from lrtc_lib.models.core.model_type import ModelType
from lrtc_lib.models.core.models_background_jobs_manager import ModelsBackgroundJobsManager
from lrtc_lib.models.ensemble import Ensemble


class ModelFactory(object):
    """
    Given a model type, this factory returns the relevant implementation of ModelAPI
    """
    def __init__(self, output_dir, models_background_jobs_manager: ModelsBackgroundJobsManager):
        self.loaded_models = {}
        self.output_dir = output_dir
        self.models_background_jobs_manager = models_background_jobs_manager

    def get_model(self, model_type: ModelType) -> ModelAPI:
        kwargs = {'output_dir': self.output_dir,
                  'models_background_jobs_manager': self.models_background_jobs_manager,
                  }
        # Ensemble models require the model factory as input
        if issubclass(model_type.cls, Ensemble):
            kwargs['model_factory'] = self

        if model_type not in self.loaded_models:
            try:
                model = model_type.cls(**kwargs)
                self.loaded_models[model_type] = model
            except Exception:
                logging.exception(f"Could not get model type {model_type.cls} from the model factory")

        return self.loaded_models[model_type]
