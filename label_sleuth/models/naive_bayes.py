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

from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import GaussianNB, MultinomialNB

from label_sleuth.models.core.models_background_jobs_manager import ModelsBackgroundJobsManager
from label_sleuth.models.core.languages import Languages
from label_sleuth.models.core.model_api import ModelAPI
from label_sleuth.models.core.models_factory import ModelDependencies
from label_sleuth.models.core.prediction import Prediction
from label_sleuth.models.core.tools import RepresentationType

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s')


class NaiveBayes(ModelAPI):
    def __init__(self, output_dir, representation_type: RepresentationType,
                 models_background_jobs_manager: ModelsBackgroundJobsManager,
                 model_dependencies: ModelDependencies,
                 max_datapoints=10000):
        super().__init__(models_background_jobs_manager)
        self.model_dir = os.path.join(output_dir, "nb")
        os.makedirs(self.model_dir, exist_ok=True)
        self.features_num = 0
        self.max_datapoints = max_datapoints
        self.infer_batch_size = max_datapoints
        self.representation_type = representation_type
        if self.representation_type == RepresentationType.GLOVE:
            self.sentence_embedding_service = model_dependencies.sentence_embedding_service

    def _train(self, model_id, train_data, model_params):
        model = MultinomialNB() if self.representation_type == RepresentationType.BOW else GaussianNB()
        language = self.get_language(model_id)
        texts = [x['text'] for x in train_data]
        texts = texts[:self.max_datapoints]
        train_data_features, vectorizer = self.input_to_features(texts, language=language)
        labels = [x['label'] for x in train_data]
        labels = labels[:self.max_datapoints]
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

        items_to_infer = [x['text'] for x in items_to_infer]
        last_batch = 0
        predictions = []
        while last_batch < len(items_to_infer):
            batch = items_to_infer[last_batch:last_batch + self.infer_batch_size]
            last_batch += self.infer_batch_size
            batch, _ = self.input_to_features(batch, language=language, vectorizer=vectorizer)
            predictions.append(model.predict_proba(batch))
        predictions = np.concatenate(predictions, axis=0)

        labels = [bool(np.argmax(prediction)) for prediction in predictions]
        # The True label is in the second position as sorted([True, False]) is [False, True]
        scores = [prediction[1] for prediction in predictions]
        return [Prediction(label=label, score=score) for label, score in zip(labels, scores)]

    def input_to_features(self, texts, language=Languages.ENGLISH, vectorizer=None):
        if self.representation_type == RepresentationType.BOW:
            if vectorizer is None:
                vectorizer = CountVectorizer(analyzer="word", tokenizer=None, preprocessor=None, stop_words=None,
                                             lowercase=True, max_features=1000)
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


class NaiveBayes_BOW(NaiveBayes):
    def __init__(self, output_dir, models_background_jobs_manager, model_dependencies):
        super().__init__(output_dir=output_dir, models_background_jobs_manager=models_background_jobs_manager,
                         representation_type=RepresentationType.BOW, model_dependencies=model_dependencies)


class NaiveBayes_GloVe(NaiveBayes):
    def __init__(self, output_dir, models_background_jobs_manager, model_dependencies):
        super().__init__(output_dir=output_dir, models_background_jobs_manager=models_background_jobs_manager,
                         representation_type=RepresentationType.GLOVE, model_dependencies=model_dependencies)
