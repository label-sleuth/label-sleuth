import pickle
import shutil
import os
import numpy as np

import sklearn.svm
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.multiclass import OneVsRestClassifier

from lrtc_lib.definitions import ROOT_DIR


import logging

from lrtc_lib.models.core.languages import Languages
from lrtc_lib.models.core.model_api import ModelAPI
from lrtc_lib.models.core.tools import RepresentationType, get_glove_representation

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s')

# TODO remove unsupported types (multi-label etc.)
class SVM(ModelAPI):
    def __init__(self, representations_type: RepresentationType, multi_label=False,
                 model_dir=os.path.join(ROOT_DIR, "output", "models", "svm"), kernel="linear"):
        super().__init__()
        os.makedirs(model_dir, exist_ok=True)
        self.model_dir = model_dir

        self.kernel = kernel
        self.representation_type = representations_type
        self.multi_label = multi_label


    def _train(self, model_id, train_data, train_params):
        if self.kernel == "linear":
            svm_implementation = sklearn.svm.LinearSVC()
        elif self.kernel == "rbf":
            logging.warning("Using some arbitrary low gamma, gamma and C values might be better with tuning")
            svm_implementation = sklearn.svm.SVC(gamma=1e-08)
        else:
            raise ValueError("Unknown kernel type")

        if self.multi_label:
            model = OneVsRestClassifier(svm_implementation)
        else:
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

        features_all_texts, _ = self.input_to_features([x['text'] for x in items_to_infer], language=language, train=False, vectorizer=vectorizer)
        labels = model.predict(features_all_texts).tolist()
        scores = self.get_probs(model, features_all_texts)
        scores = scores.tolist() # to be json serializable
        return {"labels": labels, "scores": scores}

    def get_probs(self, model, features):
        distances = np.array(model.decision_function(features))  # get distances from hyperplanes (per class)
        # Binary class may produce only 1 class instead of 2
        if len(distances.shape) == 1:
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

    import uuid
    svm = SVM(RepresentationType.GLOVE)

    train_data = [{"text": "I love dogs", "label": 2},
                  {"text": "I like to play with dogs", "label": 1},
                  {"text": "dogs are better than cats", "label": 1},
                  {"text": "cats cats cats", "label": 0},
                  {"text": "play with cats", "label": 0},
                  {"text": "dont know", "label": 0},
                  {"text": "what else", "label": 0}]

    # train_data = [{"text": 'text1__CONTEXT__main_text__CONTEXT__text2', "label": 1},
    #               {"text": 'before text__CONTEXT__fascinating text__CONTEXT__after text', "label": 0},
    #               ]

    model_id = svm.train(train_data, {})
    infer_list = []
    for x in range(3):
        # infer_list.append({"text": "hello " + str(uuid.uuid4()) + str(x)})
        infer_list.append({"text": "some context__CONTEXT__hello " + str(uuid.uuid4()) + str(x) + "__CONTEXT__some other context"})
    res = svm.infer(model_id, infer_list, {})
    print(res)
