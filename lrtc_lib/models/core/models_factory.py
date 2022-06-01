import logging

from lrtc_lib.models.core.model_api import ModelAPI
from lrtc_lib.models.core.model_types import ModelTypes
from lrtc_lib.models.core.models_background_jobs_manager import ModelsBackgroundJobsManager
from lrtc_lib.models.core.tools import RepresentationType


class ModelFactory(object):
    """
    Given a model type, this factory returns the relevant implementation of ModelAPI
    """
    def __init__(self, output_dir, models_background_jobs_manager: ModelsBackgroundJobsManager):
        self.loaded_models = {}
        self.output_dir = output_dir
        self.models_background_jobs_manager = models_background_jobs_manager

    def get_model(self, model_type: ModelTypes) -> ModelAPI:
        try:
            if model_type == ModelTypes.RAND:
                if model_type not in self.loaded_models:
                    from lrtc_lib.models.random_model import RandomModel
                    self.loaded_models[model_type] = RandomModel(self.output_dir, self.models_background_jobs_manager)

            elif model_type == ModelTypes.HF_BERT:
                if model_type not in self.loaded_models:
                    from lrtc_lib.models.hf_transformers import HFTransformers
                    self.loaded_models[model_type] = \
                        HFTransformers(self.output_dir, self.models_background_jobs_manager,
                                       pretrained_model='bert-base-uncased')

            elif model_type == ModelTypes.SVM_ENSEMBLE:
                from lrtc_lib.models.ensemble import Ensemble
                if model_type not in self.loaded_models:
                    self.loaded_models[model_type] = \
                        Ensemble(self.output_dir, model_types=[ModelTypes.SVM_OVER_BOW, ModelTypes.SVM_OVER_GLOVE],
                                 model_factory=self,
                                 models_background_jobs_manager=self.models_background_jobs_manager)

            elif model_type == ModelTypes.SVM_OVER_GLOVE:
                from lrtc_lib.models.svm import SVM
                if model_type not in self.loaded_models:
                    self.loaded_models[model_type] = SVM(self.output_dir, RepresentationType.GLOVE,
                                                         self.models_background_jobs_manager)

            elif model_type == ModelTypes.SVM_OVER_BOW:
                from lrtc_lib.models.svm import SVM
                if model_type not in self.loaded_models:
                    self.loaded_models[model_type] = SVM(self.output_dir, RepresentationType.BOW,
                                                         self.models_background_jobs_manager)

            elif model_type == ModelTypes.NB_OVER_GLOVE:
                from lrtc_lib.models.naive_bayes import NaiveBayes
                if model_type not in self.loaded_models:
                    self.loaded_models[model_type] = \
                        NaiveBayes(self.output_dir, RepresentationType.GLOVE, self.models_background_jobs_manager)

            elif model_type == ModelTypes.NB_OVER_BOW:
                from lrtc_lib.models.naive_bayes import NaiveBayes
                if model_type not in self.loaded_models:
                    self.loaded_models[model_type] = \
                        NaiveBayes(self.output_dir, RepresentationType.BOW, self.models_background_jobs_manager)
            else:
                try:
                    args = {'output_dir': self.output_dir,
                            'model_factory': self,
                            'manager': self.models_background_jobs_manager
                            }

                    self.loaded_models[model_type] = ModelFactory.import_by_reflection(model_type.name)(**args)
#
                except Exception:
                    raise Exception(f"Model type {model_type} is not supported by {self.__class__.__name__}")

        except Exception:
            logging.exception(f"Could not get model type {model_type} from the model factory")

        return self.loaded_models[model_type]

    @classmethod
    def import_by_reflection(cls, name):
        components = name.split('.')
        mod = __import__(components[0])
        for comp in components[1:]:
            mod = getattr(mod, comp)
        return mod



