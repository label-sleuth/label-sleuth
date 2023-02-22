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

import numpy as np

from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import GaussianNB, MultinomialNB, _BaseNB

from label_sleuth.models.core.languages import Language, Languages
from label_sleuth.models.core.model_api import ModelAPI
from label_sleuth.models.core.prediction import Prediction
from label_sleuth.models.core.tools import RepresentationType, SentenceEmbeddingService
from label_sleuth.orchestrator.background_jobs_manager import BackgroundJobsManager

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s')


@dataclass
class NaiveBayesModelComponents:
    model: _BaseNB
    vectorizer: None
    language: Language


class NaiveBayes(ModelAPI):
    def __init__(self, output_dir, representation_type: RepresentationType,
                 background_jobs_manager: BackgroundJobsManager,
                 sentence_embedding_service: SentenceEmbeddingService,
                 max_datapoints=10000):
        super().__init__(output_dir, background_jobs_manager)
        self.max_datapoints = max_datapoints
        self.infer_batch_size = max_datapoints
        self.representation_type = representation_type
        if self.representation_type == RepresentationType.WORD_EMBEDDING:
            self.sentence_embedding_service = sentence_embedding_service

    def _train(self, model_id, train_data, model_params):
        model = MultinomialNB() if self.representation_type == RepresentationType.BOW else GaussianNB()
        language = self.get_language(self.get_model_dir_by_id(model_id))
        texts = [x['text'] for x in train_data]
        texts = texts[:self.max_datapoints]
        train_data_features, vectorizer = self.input_to_features(texts, language=language)
        labels = [x['label'] for x in train_data]
        labels = labels[:self.max_datapoints]
        model.fit(train_data_features, labels)

        with open(os.path.join(self.get_model_dir_by_id(model_id), "vectorizer"), "wb") as fl:
            pickle.dump(vectorizer, fl)
        with open(os.path.join(self.get_model_dir_by_id(model_id), "model"), "wb") as fl:
            pickle.dump(model, fl)

    def load_model(self, model_path) -> NaiveBayesModelComponents:
        with open(os.path.join(model_path, "model"), "rb") as fl:
            model = pickle.load(fl)
        with open(os.path.join(model_path, "vectorizer"), "rb") as fl:
            vectorizer = pickle.load(fl)
        language = self.get_language(model_path)
        return NaiveBayesModelComponents(model=model, vectorizer=vectorizer, language=language)

    def infer(self, model_components: NaiveBayesModelComponents, items_to_infer):
        items_to_infer = [x['text'] for x in items_to_infer]
        last_batch = 0
        predictions = []
        while last_batch < len(items_to_infer):
            batch = items_to_infer[last_batch:last_batch + self.infer_batch_size]
            last_batch += self.infer_batch_size
            batch, _ = self.input_to_features(batch, language=model_components.language,
                                              vectorizer=model_components.vectorizer)
            predictions.append(model_components.model.predict_proba(batch))
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
        elif self.representation_type == RepresentationType.WORD_EMBEDDING:
            return self.sentence_embedding_service.get_sentence_embeddings_representation(texts, language=language), None

    def get_model_dir_name(self): # for backward compatibility, we override the default get_model_dir_name()
        return "nb"


class NaiveBayes_BOW(NaiveBayes):
    def __init__(self, output_dir, background_jobs_manager, sentence_embedding_service):
        super().__init__(output_dir=output_dir, background_jobs_manager=background_jobs_manager,
                         representation_type=RepresentationType.BOW,
                         sentence_embedding_service=sentence_embedding_service)

    def get_supported_languages(self):
        return Languages.all_languages()



class NaiveBayes_WordEmbeddings(NaiveBayes):
    def __init__(self, output_dir, background_jobs_manager, sentence_embedding_service):
        super().__init__(output_dir=output_dir, background_jobs_manager=background_jobs_manager,
                         representation_type=RepresentationType.WORD_EMBEDDING,
                         sentence_embedding_service=sentence_embedding_service)

    def get_supported_languages(self):
        return Languages.all_languages()
