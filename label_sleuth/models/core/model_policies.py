#
#  Copyright (c) 2022 IBM Corp.
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#  http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#

from label_sleuth.models.core.catalog import ModelsCatalog
from label_sleuth.models.policy.static_model_policy import StaticModelPolicy


class ModelPolicies:
    """
    Model policies determine which type of classification model is used. Policies can be static, i.e. always return the
    same model type, or dynamic, e.g. a different model type is returned depending on the current iteration.
    """
    STATIC_SVM_ENSEMBLE = StaticModelPolicy(ModelsCatalog.SVM_ENSEMBLE)
    STATIC_SVM_WORD_EMBEDDINGS = StaticModelPolicy(ModelsCatalog.SVM_OVER_WORD_EMBEDDINGS)
    STATIC_SVM_GLOVE = StaticModelPolicy(ModelsCatalog.SVM_OVER_WORD_EMBEDDINGS)  # for backward compatibility
    STATIC_SVM_BOW = StaticModelPolicy(ModelsCatalog.SVM_OVER_BOW)
    STATIC_NB_WORD_EMBEDDINGS = StaticModelPolicy(ModelsCatalog.NB_OVER_WORD_EMBEDDINGS)
    STATIC_NB_BOW = StaticModelPolicy(ModelsCatalog.NB_OVER_BOW)
    STATIC_HF_BERT = StaticModelPolicy(ModelsCatalog.HF_BERT)
    STATIC_HF_XLM_ROBERTA = StaticModelPolicy(ModelsCatalog.HF_XLM_ROBERTA)
