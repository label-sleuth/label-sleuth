from label_sleuth.active_learning.core.catalog import ActiveLearningCatalog
from label_sleuth.active_learning.policy.static_active_learning_policy import StaticActiveLearningPolicy


class ActiveLearningPolicies:
    """
    Active learning policies determine which type of active learning strategy is used. Policies can be static, i.e.
    always return the same active learning strategy, or dynamic, e.g. a different strategy is returned depending on
    the current iteration number.
    """
    STATIC_RETROSPECTIVE = StaticActiveLearningPolicy(ActiveLearningCatalog.RETROSPECTIVE)
    STATIC_HARD_MINING = StaticActiveLearningPolicy(ActiveLearningCatalog.HARD_MINING)
    STATIC_RANDOM = StaticActiveLearningPolicy(ActiveLearningCatalog.RANDOM)