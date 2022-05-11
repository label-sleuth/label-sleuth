import logging
import os
import pickle

import numpy as np

from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import GaussianNB, MultinomialNB

from lrtc_lib.models.core.models_background_jobs_manager import ModelsBackgroundJobsManager
from lrtc_lib.definitions import ROOT_DIR
from lrtc_lib.models.core.languages import Languages
from lrtc_lib.models.core.model_api import ModelAPI
from lrtc_lib.models.core.prediction import Prediction
from lrtc_lib.models.core.tools import RepresentationType, get_glove_representation

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s')


class NaiveBayes(ModelAPI):
    def __init__(self, representation_type: RepresentationType,
                 models_background_jobs_manager: ModelsBackgroundJobsManager,
                 max_datapoints=10000, model_dir=os.path.join(ROOT_DIR, "output", "models", "nb")):
        super().__init__(models_background_jobs_manager)
        os.makedirs(model_dir, exist_ok=True)
        self.model_dir = model_dir

        self.features_num = 0
        self.max_datapoints = max_datapoints
        self.infer_batch_size = max_datapoints
        self.representation_type = representation_type

    def input_to_features(self, input_data, language=Languages.ENGLISH, train=False, vectorizer=None):
        if self.representation_type == RepresentationType.BOW:
            if train:
                vectorizer = CountVectorizer(analyzer="word", tokenizer=None, preprocessor=None, stop_words=None,
                                             lowercase=True, max_features=1000)
                train_data_features = vectorizer.fit_transform(input_data)
                return train_data_features, vectorizer
            else:
                return vectorizer.transform(input_data), None
        elif self.representation_type == RepresentationType.GLOVE:
            return get_glove_representation(input_data, language=language), None

    def _train(self, model_id, train_data, train_params):
        model = MultinomialNB() if self.representation_type == RepresentationType.BOW else GaussianNB()
        language = self.get_language(model_id)
        texts = [x['text'] for x in train_data]
        texts = texts[:self.max_datapoints]
        train_data_features, vectorizer = self.input_to_features(texts, language=language, train=True)
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
            batch, _ = self.input_to_features(batch, language=language, train=False, vectorizer=vectorizer)
            predictions.append(model.predict_proba(batch))
        predictions = np.concatenate(predictions, axis=0)

        labels = [bool(np.argmax(prediction)) for prediction in predictions]
        # The True label is in the second position as sorted([True, False]) is [False, True]
        scores = [prediction[1] for prediction in predictions]
        return [Prediction(label=label, score=score) for label, score in zip(labels, scores)]

    def model_file_by_id(self, model_id):
        return os.path.join(self.get_model_dir_by_id(model_id), "model")

    def vectorizer_file_by_id(self, model_id):
        return os.path.join(self.get_model_dir_by_id(model_id), "vectorizer")

    def get_models_dir(self):
        return self.model_dir


if __name__ == '__main__':
    model = NaiveBayes(representation_type=RepresentationType.BOW)

    train_data = [{"text": "what else", "label": False},
        {"text": "I love dogs", "label": True},
                  {"text": "I like to play with dogs", "label": True},
                  {"text": "dogs are better than cats", "label": True},
                  {"text": "cats cats cats", "label": False},
                  {"text": "play with cats", "label": False},
                  {"text": "dont know", "label": False},
                  ]

    model_id,_ = model.train(train_data, {})
    print(model_id)
    import uuid
    import time
    time.sleep(5)
    infer_list = []
    for x in range(3):
        infer_list.append({"text": "hello " + str(uuid.uuid4()) + str(x)})
    infer_list.append({"text":"I really love dogs"})
    res = model.infer(model_id, infer_list, {})
    print(res)

