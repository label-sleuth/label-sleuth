
import logging

from lrtc_lib.models.core.model_types import ModelTypes
from lrtc_lib.models.core.tools import RepresentationType


class ModelFactory(object):
    def __init__(self):
        self.loaded_models = {}

    def get_model(self, model_type: ModelTypes):
        from lrtc_lib.definitions import ASYNC
        try:
            if model_type == ModelTypes.RAND:
                if model_type not in self.loaded_models:
                    from lrtc_lib.models.random_model import RandomModel
                    self.loaded_models[model_type] = RandomModel()
            elif model_type == ModelTypes.HF_BERT:
                if model_type not in self.loaded_models:
                    from lrtc_lib.models.hf_transformers import HFTransformers
                    self.loaded_models[model_type] = HFTransformers(50)
            elif model_type == ModelTypes.SVM_ENSEMBLE:
                from lrtc_lib.models.ensemble import Ensemble
                if model_type not in self.loaded_models:
                    self.loaded_models[model_type] = \
                        Ensemble(model_types=[ModelTypes.SVM_OVER_BOW,
                                              ModelTypes.SVM_OVER_GLOVE])
            elif model_type == ModelTypes.SVM_OVER_GLOVE:
                from lrtc_lib.models.svm import SVM
                if model_type not in self.loaded_models:
                    self.loaded_models[model_type] = SVM(RepresentationType.GLOVE, async_call=ASYNC)
            elif model_type == ModelTypes.SVM_OVER_BOW:
                from lrtc_lib.models.svm import SVM
                if model_type not in self.loaded_models:
                    self.loaded_models[model_type] = SVM(RepresentationType.BOW, async_call=ASYNC)

            elif model_type == ModelTypes.NB_OVER_GLOVE:
                from lrtc_lib.models.naive_bayes import NaiveBayes
                if model_type not in self.loaded_models:
                    self.loaded_models[model_type] = NaiveBayes(RepresentationType.GLOVE, async_call=ASYNC)
            elif model_type == ModelTypes.NB_OVER_BOW:
                from lrtc_lib.models.naive_bayes import NaiveBayes
                if model_type not in self.loaded_models:
                    self.loaded_models[model_type] = NaiveBayes(RepresentationType.BOW, async_call=ASYNC)
            else:
                raise Exception(f"model type {model_type.name} is not supported by {self.__class__.__name__}")
        except Exception:
            logging.exception(f"could not get train and infer {model_type} from the internal train and infer factory")

        return self.loaded_models[model_type]

