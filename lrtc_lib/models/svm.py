import logging
import os
import pickle

import numpy as np

import sklearn.svm
from sklearn.feature_extraction.text import CountVectorizer

from lrtc_lib.models.core.models_background_jobs_manager import ModelsBackgroundJobsManager
from lrtc_lib.definitions import ROOT_DIR
from lrtc_lib.models.core.languages import Languages
from lrtc_lib.models.core.model_api import ModelAPI, Prediction
from lrtc_lib.models.core.tools import RepresentationType, get_glove_representation

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s')

# TODO remove unsupported types (multi-label etc.)
class SVM(ModelAPI):
    def __init__(self, representation_type: RepresentationType,
                 models_background_jobs_manager: ModelsBackgroundJobsManager,
                 kernel="linear", model_dir=os.path.join(ROOT_DIR, "output", "models", "svm")):
        super().__init__(models_background_jobs_manager)
        os.makedirs(model_dir, exist_ok=True)
        self.model_dir = model_dir

        self.kernel = kernel
        self.representation_type = representation_type

    def _train(self, model_id, train_data, train_params):
        if self.kernel == "linear":
            svm_implementation = sklearn.svm.LinearSVC()
        elif self.kernel == "rbf":
            logging.warning("Using some arbitrary low gamma, gamma and C values might be better with tuning")
            svm_implementation = sklearn.svm.SVC(gamma=1e-08)
        else:
            raise ValueError("Unknown kernel type")

        model = svm_implementation
        language = self.get_language(model_id)
        texts = [x['text'] for x in train_data]
        train_data_features, vectorizer = self.input_to_features(texts, language=language, train=True)
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
                                                       train=False, vectorizer=vectorizer)
        labels = model.predict(features_all_texts).tolist()
        # The True label is in the second position as sorted([True, False]) is [False, True]
        scores = [probs[1] for probs in self.get_probs(model, features_all_texts)]
        return [Prediction(label=label, score=score) for label, score in zip(labels, scores)]

    def get_probs(self, model, features):
        distances = np.array(model.decision_function(features))  # get distances from hyperplanes (per class)
        if len(distances.shape) == 1: # binary classification
            distances = distances / 2 + 0.5
            distances = np.expand_dims(distances, 1)
            distances = np.concatenate([1 - distances, distances], axis=1)
        prob = np.exp(distances) / np.sum(np.exp(distances), axis=1,
                                          keepdims=True)  # softmax to convert distances to probabilities
        return prob

    def input_to_features(self, texts, language=Languages.ENGLISH, vectorizer=None, train=False):
        if self.representation_type == RepresentationType.BOW:
            if train:
                vectorizer = CountVectorizer(analyzer="word", tokenizer=None, preprocessor=None, stop_words=None,
                                             lowercase=True, max_features=10000)
                train_data_features = vectorizer.fit_transform(texts)
                return train_data_features, vectorizer
            else:
                return vectorizer.transform(texts), None
        elif self.representation_type == RepresentationType.GLOVE:
            return get_glove_representation(texts, language=language), None

    def model_file_by_id(self, model_id):
        return os.path.join(self.get_model_dir_by_id(model_id), "model")

    def vectorizer_file_by_id(self, model_id):
        return os.path.join(self.get_model_dir_by_id(model_id), "vectorizer")

    def get_models_dir(self):
        return self.model_dir


if __name__ == '__main__':
    model = SVM(representation_type=RepresentationType.GLOVE)

    train_data = [{"text": "I love dogs", "label": True},
                  {"text": "I like to play with dogs", "label": True},
                  {"text": "dogs are better than cats", "label": True},
                  {"text": "cats cats cats", "label": False},
                  {"text": "play with cats", "label": False},
                  {"text": "dont know", "label": False},
                  {"text": "what else", "label": False}]


    model_id,_ = model.train(train_data, {})
    print(model_id)
    import uuid
    import time
    time.sleep(10)
    infer_list = []
    infer_list.append({"text": "I really love dogs"})
    for x in range(3):
        infer_list.append({"text": "hello " + str(uuid.uuid4()) + str(x)})
    infer_list.append({"text":"I really love dogs"})
    res = model.infer(model_id, infer_list)
    print(res)

