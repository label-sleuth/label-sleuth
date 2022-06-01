# from enum import Enum


# class ModelTypess(Enum):
#     RAND = 0
#     NB_OVER_BOW = 1
#     NB_OVER_GLOVE = 2
#     SVM_OVER_BOW = 3
#     SVM_OVER_GLOVE = 4
#     SVM_ENSEMBLE = 5
#     HF_BERT = 6

class ModelTypes:
    def __init__(self, name: str):
        self.name = name


ModelTypes.RAND = ModelTypes("RAND")
ModelTypes.NB_OVER_BOW = ModelTypes("NB_OVER_BOW")
ModelTypes.NB_OVER_GLOVE = ModelTypes("NB_OVER_GLOVE")
ModelTypes.SVM_OVER_BOW = ModelTypes("SVM_OVER_BOW")
ModelTypes.SVM_OVER_GLOVE = ModelTypes("SVM_OVER_GLOVE")
ModelTypes.SVM_ENSEMBLE = ModelTypes("SVM_ENSEMBLE")
ModelTypes.HF_BERT = ModelTypes("HF_BERT")