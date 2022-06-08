from label_sleuth.models.core.model_type import ModelType
from label_sleuth.models.ensemble import SVM_Ensemble
from label_sleuth.models.hf_transformers import HFTransformers
from label_sleuth.models.naive_bayes import NaiveBayes_BOW, NaiveBayes_GloVe
from label_sleuth.models.random_model import RandomModel
from label_sleuth.models.svm import SVM_BOW, SVM_GloVe


class ModelsCatalog:
    RAND = ModelType(RandomModel)
    NB_OVER_BOW = ModelType(NaiveBayes_BOW)
    NB_OVER_GLOVE = ModelType(NaiveBayes_GloVe)
    SVM_OVER_BOW = ModelType(SVM_BOW)
    SVM_OVER_GLOVE = ModelType(SVM_GloVe)
    SVM_ENSEMBLE = ModelType(SVM_Ensemble)
    HF_BERT = ModelType(HFTransformers)

