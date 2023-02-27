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

from label_sleuth.models.core.model_type import ModelType
from label_sleuth.models.ensemble import SVM_Ensemble
from label_sleuth.models.hf_transformers import HFBert, HFXLMRoberta
from label_sleuth.models.naive_bayes import NaiveBayes_BOW, NaiveBayes_WordEmbeddings
from label_sleuth.models.random_model import RandomModel
from label_sleuth.models.svm import SVM_BOW, SVM_WordEmbeddings


class ModelsCatalog:
    RAND = ModelType(RandomModel)
    NB_OVER_BOW = ModelType(NaiveBayes_BOW)
    NB_OVER_WORD_EMBEDDINGS = ModelType(NaiveBayes_WordEmbeddings)
    SVM_OVER_BOW = ModelType(SVM_BOW)
    SVM_OVER_WORD_EMBEDDINGS = ModelType(SVM_WordEmbeddings)
    SVM_ENSEMBLE = ModelType(SVM_Ensemble)
    HF_BERT = ModelType(HFBert)
    HF_XLM_ROBERTA = ModelType(HFXLMRoberta)

