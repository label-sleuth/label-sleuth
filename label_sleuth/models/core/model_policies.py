from label_sleuth.models.core.catalog import ModelsCatalog
from label_sleuth.models.policy.static_model_policy import StaticModelPolicy


class ModelPolicies(object):
    """
    Model policies determine which type of classification model is used. Policies can be static, i.e. always return the
    same model type, or dynamic, e.g. a different model type is returned depending on the current iteration.
    """
    STATIC_SVM_ENSEMBLE = StaticModelPolicy(ModelsCatalog.SVM_ENSEMBLE)
    STATIC_SVM = StaticModelPolicy(ModelsCatalog.SVM_OVER_GLOVE)
    STATIC_HF_BERT = StaticModelPolicy(ModelsCatalog.HF_BERT)
