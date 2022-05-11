from enum import Enum


class ModelTypes(Enum):
    RAND = 0
    NB_OVER_BOW = 1
    NB_OVER_GLOVE = 2
    SVM_OVER_BOW = 3
    SVM_OVER_GLOVE = 4
    SVM_ENSEMBLE = 5
    HF_BERT = 6
