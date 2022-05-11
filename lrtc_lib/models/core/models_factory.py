import logging

from lrtc_lib.models.core.model_api import ModelAPI
from lrtc_lib.models.core.model_types import ModelTypes
from lrtc_lib.models.core.models_background_jobs_manager import ModelsBackgroundJobsManager
from lrtc_lib.models.core.tools import RepresentationType


class ModelFactory(object):
    """
    Given a model type, this factory returns the relevant implementation of ModelAPI
    """
    def __init__(self, models_background_jobs_manager: ModelsBackgroundJobsManager):
        self.loaded_models = {}
        self.models_background_jobs_manager = models_background_jobs_manager

    def get_model(self, model_type: ModelTypes) -> ModelAPI:
        try:
            if model_type == ModelTypes.RAND:
                if model_type not in self.loaded_models:
                    from lrtc_lib.models.random_model import RandomModel
                    self.loaded_models[model_type] = RandomModel(self.models_background_jobs_manager)

            elif model_type == ModelTypes.HF_BERT:
                if model_type not in self.loaded_models:
                    from lrtc_lib.models.hf_transformers import HFTransformers
                    self.loaded_models[model_type] = \
                        HFTransformers(self.models_background_jobs_manager, pretrained_model='bert-base-uncased')

            elif model_type == ModelTypes.SVM_ENSEMBLE:
                from lrtc_lib.models.ensemble import Ensemble
                if model_type not in self.loaded_models:
                    self.loaded_models[model_type] = \
                        Ensemble(model_types=[ModelTypes.SVM_OVER_BOW, ModelTypes.SVM_OVER_GLOVE],
                                 models_background_jobs_manager=self.models_background_jobs_manager)

            elif model_type == ModelTypes.SVM_OVER_GLOVE:
                from lrtc_lib.models.svm import SVM
                if model_type not in self.loaded_models:
                    self.loaded_models[model_type] = SVM(RepresentationType.GLOVE, self.models_background_jobs_manager)

            elif model_type == ModelTypes.SVM_OVER_BOW:
                from lrtc_lib.models.svm import SVM
                if model_type not in self.loaded_models:
                    self.loaded_models[model_type] = SVM(RepresentationType.BOW, self.models_background_jobs_manager)

            elif model_type == ModelTypes.NB_OVER_GLOVE:
                from lrtc_lib.models.naive_bayes import NaiveBayes
                if model_type not in self.loaded_models:
                    self.loaded_models[model_type] = \
                        NaiveBayes(RepresentationType.GLOVE, self.models_background_jobs_manager)

            elif model_type == ModelTypes.NB_OVER_BOW:
                from lrtc_lib.models.naive_bayes import NaiveBayes
                if model_type not in self.loaded_models:
                    self.loaded_models[model_type] = \
                        NaiveBayes(RepresentationType.BOW, self.models_background_jobs_manager)
            else:
                raise Exception(f"Model type {model_type.name} is not supported by {self.__class__.__name__}")

        except Exception:
            logging.exception(f"Could not get model type {model_type} from the model factory")

        return self.loaded_models[model_type]
