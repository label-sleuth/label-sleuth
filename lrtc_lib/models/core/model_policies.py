from lrtc_lib.models.core.model_types import ModelTypes
from lrtc_lib.models.core.models_factory import ModelFactory
from lrtc_lib.models.policy.static_model_policy import StaticModelPolicy


class ModelPolicies(object):
    """
    Model policies determine which type of classification model is used. Policies can be static, i.e. always return the
    same model type, or dynamic, e.g. a different model type is returned depending on the current iteration.
    """
    STATIC_SVM_ENSEMBLE = StaticModelPolicy(ModelTypes.SVM_ENSEMBLE)
    STATIC_SVM = StaticModelPolicy(ModelTypes.SVM_OVER_GLOVE)
    STATIC_HF_BERT = StaticModelPolicy(ModelTypes.HF_BERT)

    @classmethod
    def get_policy_by_name(cls, name: str):
        if '.' in name:
            model_cls = ModelFactory.import_by_reflection(name)

            short_name = name.split('.')[-1]

            setattr(ModelTypes, short_name, StaticModelPolicy(ModelTypes(name)))
            modeltype = getattr(ModelTypes, short_name)

            return modeltype
        else:
            return getattr(ModelPolicies, name)
        raise NotImplementedError(name)

