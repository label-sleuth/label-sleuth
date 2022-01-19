# (c) Copyright IBM Corporation 2020.

# LICENSE: Apache License 2.0 (Apache-2.0)
# http://www.apache.org/licenses/LICENSE-2.0
import logging

from lrtc_lib.train_and_infer_service.model_type import ModelType, ModelTypes
from lrtc_lib.train_and_infer_service.tools import RepresentationType


class TrainAndInferFactory(object):
    def __init__(self):
        self.loaded_train_and_infer = {}

    def get_train_and_infer(self, model_type: ModelType):
        from lrtc_lib.definitions import ASYNC
        try:
            if model_type == ModelTypes.RAND:
                if self.train_and_infer_random is None:
                    from lrtc_lib.train_and_infer_service.train_and_infer_random import TrainAndInferRandom
                    self.train_and_infer_random = TrainAndInferRandom()
                return self.train_and_infer_random
            elif model_type == ModelTypes.HFBERT:
                if self.train_and_infer_hf is None:
                    from lrtc_lib.train_and_infer_service.train_and_infer_hf import TrainAndInferHF
                    self.train_and_infer_hf = TrainAndInferHF(50)
                return self.train_and_infer_hf
            elif model_type == ModelTypes.M_SVM:
                from lrtc_lib.train_and_infer_service.train_and_infer_multi import TrainAndInferMulti
                if model_type not in self.loaded_train_and_infer:
                    self.loaded_train_and_infer[model_type] = \
                        TrainAndInferMulti(factory=self, model_types=[ModelTypes.SVM_OVER_BOW,
                                                                      ModelTypes.SVM_OVER_GLOVE])
            elif model_type == ModelTypes.SVM_OVER_GLOVE:
                from lrtc_lib.train_and_infer_service.train_and_infer_svm import TrainAndInferSVM
                if model_type not in self.loaded_train_and_infer:
                    self.loaded_train_and_infer[model_type] = TrainAndInferSVM(RepresentationType.GLOVE,
                                                                               async_call=ASYNC)
            elif model_type == ModelTypes.SVM_OVER_BOW:
                from lrtc_lib.train_and_infer_service.train_and_infer_svm import TrainAndInferSVM
                if model_type not in self.loaded_train_and_infer:
                    self.loaded_train_and_infer[model_type] = TrainAndInferSVM(RepresentationType.BOW, async_call=ASYNC)

            elif model_type == ModelTypes.NB_OVER_GLOVE:
                from lrtc_lib.train_and_infer_service.train_and_infer_nb import TrainAndInferNB
                if model_type not in self.loaded_train_and_infer:
                    self.loaded_train_and_infer[model_type] = TrainAndInferNB(RepresentationType.GLOVE,
                                                                              async_call=ASYNC)
            elif model_type == ModelTypes.NB_OVER_BOW:
                from lrtc_lib.train_and_infer_service.train_and_infer_custom_nb import TrainAndInferCustomNB
                if model_type not in self.loaded_train_and_infer:
                    self.loaded_train_and_infer[model_type] = TrainAndInferCustomNB(RepresentationType.BOW,
                                                                                    async_call=ASYNC)
            else:
                raise Exception(f"model type {model_type.name} is not supported by {self.__class__.__name__}")
        except Exception:
            logging.exception(f"could not get train and infer {model_type} from the internal train and infer factory")

        return self.loaded_train_and_infer[model_type]

