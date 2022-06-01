from lrtc_lib.models.core.model_type import ModelType
from lrtc_lib.models.ensemble import SVM_Ensemble
from lrtc_lib.models.hf_transformers import HFTransformers
from lrtc_lib.models.naive_bayes import NaiveBayes_BOW, NaiveBayes_GloVe
from lrtc_lib.models.random_model import RandomModel
from lrtc_lib.models.svm import SVM_BOW, SVM_GloVe


class ModelsCatalog:
    RAND = ModelType(RandomModel)
    NB_OVER_BOW = ModelType(NaiveBayes_BOW)
    NB_OVER_GLOVE = ModelType(NaiveBayes_GloVe)
    SVM_OVER_BOW = ModelType(SVM_BOW)
    SVM_OVER_GLOVE = ModelType(SVM_GloVe)
    SVM_ENSEMBLE = ModelType(SVM_Ensemble)
    HF_BERT = ModelType(HFTransformers)

