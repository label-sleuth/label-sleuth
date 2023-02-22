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

import logging
import os
import pickle

from dataclasses import dataclass
from typing import Union

import numpy as np

import sklearn.svm
from sklearn.feature_extraction.text import CountVectorizer

from label_sleuth.models.core.languages import Language, Languages
from label_sleuth.models.core.model_api import ModelAPI
from label_sleuth.models.core.prediction import Prediction
from label_sleuth.models.core.tools import RepresentationType, SentenceEmbeddingService
from label_sleuth.orchestrator.background_jobs_manager import BackgroundJobsManager

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s')

@dataclass
class SVMModelComponents:
    model: Union[sklearn.svm.LinearSVC, sklearn.svm.SVC]
    vectorizer: None
    language: Language


class SVM(ModelAPI):
    def __init__(self, output_dir, representation_type: RepresentationType,
                 background_jobs_manager: BackgroundJobsManager, sentence_embedding_service: SentenceEmbeddingService,
                 kernel="linear"):
        super().__init__(output_dir, background_jobs_manager)
        self.kernel = kernel
        self.representation_type = representation_type
        if self.representation_type == RepresentationType.WORD_EMBEDDING:
            self.sentence_embedding_service = sentence_embedding_service

    def _train(self, model_id, train_data, model_params):
        if self.kernel == "linear":
            model = sklearn.svm.LinearSVC()
        elif self.kernel == "rbf":
            logging.warning("Using some arbitrary low gamma, gamma and C values might be better with tuning")
            model = sklearn.svm.SVC(gamma=1e-08)
        else:
            raise ValueError("Unknown kernel type")

        language = self.get_language(self.get_model_dir_by_id(model_id))
        texts = [x['text'] for x in train_data]
        train_data_features, vectorizer = self.input_to_features(texts, language=language)
        labels = np.array([x['label'] for x in train_data])

        model.fit(train_data_features, labels)

        with open(os.path.join(self.get_model_dir_by_id(model_id), "vectorizer"), "wb") as fl:
            pickle.dump(vectorizer, fl)
        with open(os.path.join(self.get_model_dir_by_id(model_id), "model"), "wb") as fl:
            pickle.dump(model, fl)

    def load_model(self, model_path) -> SVMModelComponents:
        with open(os.path.join(model_path, "model"), "rb") as fl:
            model = pickle.load(fl)
        with open(os.path.join(model_path, "vectorizer"), "rb") as fl:
            vectorizer = pickle.load(fl)
        language = self.get_language(model_path)

        return SVMModelComponents(model=model, vectorizer=vectorizer, language=language)

    def infer(self, model_components: SVMModelComponents, items_to_infer):
        features_all_texts, _ = self.input_to_features([x['text'] for x in items_to_infer],
                                                       language=model_components.language,
                                                       vectorizer=model_components.vectorizer)
        labels = model_components.model.predict(features_all_texts).tolist()
        # The True label is in the second position as sorted([True, False]) is [False, True]
        scores = [probs[1] for probs in self.get_probs(model_components.model, features_all_texts)]
        return [Prediction(label=label, score=score) for label, score in zip(labels, scores)]

    @staticmethod
    def get_probs(model, features):
        distances = np.array(model.decision_function(features))  # get distances from hyperplanes (per class)
        if len(distances.shape) == 1:  # binary classification
            distances = distances / 2 + 0.5
            distances = np.expand_dims(distances, 1)
            distances = np.concatenate([1 - distances, distances], axis=1)
        # softmax to convert distances to probabilities
        prob = np.exp(distances) / np.sum(np.exp(distances), axis=1, keepdims=True)
        return prob

    def input_to_features(self, texts, language=Languages.ENGLISH, vectorizer=None):
        if self.representation_type == RepresentationType.BOW:
            if vectorizer is None:
                vectorizer = CountVectorizer(analyzer="word", tokenizer=None, preprocessor=None, stop_words=None,
                                             lowercase=True, max_features=10000)
                train_data_features = vectorizer.fit_transform(texts)
                return train_data_features, vectorizer
            else:
                return vectorizer.transform(texts), None
        elif self.representation_type == RepresentationType.WORD_EMBEDDING:
            return self.sentence_embedding_service.get_sentence_embeddings_representation(texts, language=language), None

    def get_model_dir_name(self): # for backward compatibility, we override the default get_model_dir_name()
        return "svm"


class SVM_BOW(SVM):
    def __init__(self, output_dir, background_jobs_manager, sentence_embedding_service):
        super().__init__(output_dir=output_dir, background_jobs_manager=background_jobs_manager,
                         representation_type=RepresentationType.BOW,
                         sentence_embedding_service=sentence_embedding_service)

    def get_supported_languages(self):
        return Languages.all_languages()


class SVM_WordEmbeddings(SVM):
    def __init__(self, output_dir, background_jobs_manager, sentence_embedding_service):
        super().__init__(output_dir=output_dir, background_jobs_manager=background_jobs_manager,
                         representation_type=RepresentationType.WORD_EMBEDDING,
                         sentence_embedding_service=sentence_embedding_service)

    def get_supported_languages(self):
        return Languages.all_languages()
