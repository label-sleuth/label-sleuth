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

import numpy as np

import sklearn.svm
from sklearn.feature_extraction.text import CountVectorizer

from label_sleuth.models.core.models_background_jobs_manager import ModelsBackgroundJobsManager
from label_sleuth.models.core.languages import Languages
from label_sleuth.models.core.model_api import ModelAPI
from label_sleuth.models.core.models_factory import ModelDependencies
from label_sleuth.models.core.prediction import Prediction
from label_sleuth.models.core.tools import RepresentationType

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s')


class SVM(ModelAPI):
    def __init__(self, output_dir, representation_type: RepresentationType,
                 models_background_jobs_manager: ModelsBackgroundJobsManager,
                 model_dependencies: ModelDependencies, kernel="linear"):
        super().__init__(models_background_jobs_manager)
        self.model_dir = os.path.join(output_dir, "svm")
        os.makedirs(self.model_dir, exist_ok=True)
        self.kernel = kernel
        self.representation_type = representation_type
        if self.representation_type == RepresentationType.GLOVE:
            self.sentence_embedding_service = model_dependencies.sentence_embedding_service

    def _train(self, model_id, train_data, model_params):
        if self.kernel == "linear":
            model = sklearn.svm.LinearSVC()
        elif self.kernel == "rbf":
            logging.warning("Using some arbitrary low gamma, gamma and C values might be better with tuning")
            model = sklearn.svm.SVC(gamma=1e-08)
        else:
            raise ValueError("Unknown kernel type")

        language = self.get_language(model_id)
        texts = [x['text'] for x in train_data]
        train_data_features, vectorizer = self.input_to_features(texts, language=language)
        labels = np.array([x['label'] for x in train_data])

        model.fit(train_data_features, labels)

        with open(self.vectorizer_file_by_id(model_id), "wb") as fl:
            pickle.dump(vectorizer, fl)
        with open(self.model_file_by_id(model_id), "wb") as fl:
            pickle.dump(model, fl)

    def _infer(self, model_id, items_to_infer):
        with open(self.vectorizer_file_by_id(model_id), "rb") as fl:
            vectorizer = pickle.load(fl)
        with open(self.model_file_by_id(model_id), "rb") as fl:
            model = pickle.load(fl)
        language = self.get_language(model_id)

        features_all_texts, _ = self.input_to_features([x['text'] for x in items_to_infer], language=language,
                                                       vectorizer=vectorizer)
        labels = model.predict(features_all_texts).tolist()
        # The True label is in the second position as sorted([True, False]) is [False, True]
        scores = [probs[1] for probs in self.get_probs(model, features_all_texts)]
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
        elif self.representation_type == RepresentationType.GLOVE:
            return self.sentence_embedding_service.get_glove_representation(texts, language=language), None

    def model_file_by_id(self, model_id):
        return os.path.join(self.get_model_dir_by_id(model_id), "model")

    def vectorizer_file_by_id(self, model_id):
        return os.path.join(self.get_model_dir_by_id(model_id), "vectorizer")

    def get_models_dir(self):
        return self.model_dir


class SVM_BOW(SVM):
    def __init__(self, output_dir, models_background_jobs_manager, model_dependencies):
        super().__init__(output_dir=output_dir, models_background_jobs_manager=models_background_jobs_manager,
                         representation_type=RepresentationType.BOW, model_dependencies=model_dependencies)


class SVM_GloVe(SVM):
    def __init__(self, output_dir, models_background_jobs_manager, model_dependencies):
        super().__init__(output_dir=output_dir, models_background_jobs_manager=models_background_jobs_manager,
                         representation_type=RepresentationType.GLOVE, model_dependencies=model_dependencies)
