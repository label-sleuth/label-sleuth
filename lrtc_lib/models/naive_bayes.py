import pickle
import shutil
import os
import numpy as np

from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import GaussianNB, MultinomialNB

from lrtc_lib.definitions import ROOT_DIR

import logging

from lrtc_lib.models.core.languages import Languages
from lrtc_lib.models.core.model_api import infer_with_cache, delete_model_cache
from lrtc_lib.models.core.model_async import ModelAsync, update_train_status
from lrtc_lib.models.core.tools import RepresentationType, get_glove_representation

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s')


class NaiveBayes(ModelAsync):
    def __init__(self, representation_type, max_datapoints=10000, async_call=False,
                 model_dir=os.path.join(ROOT_DIR, "output", "models", "custom_nb")):
        super(NaiveBayes, self).__init__(async_call=async_call)
        self.model_dir = model_dir
        os.makedirs(self.get_models_dir(), exist_ok=True)
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

    @update_train_status
    def train_with_async_support(self, model_id, train_data, dev_data, train_params):
        model = MultinomialNB() if self.representation_type == RepresentationType.BOW else GaussianNB()
        # Train the model using the training sets
        language = self.get_language(model_id)
        sentences = [sentence["text"] for sentence in train_data]
        sentences = sentences[:self.max_datapoints]
        labels = [sentence["label"] for sentence in train_data]
        labels = labels[:self.max_datapoints]
        features, vectorizer = self.input_to_features(sentences, language=language, train=True)
        model.fit(features, labels)

        with open(self.vectorizer_file_by_id(model_id), "wb") as fl:
            pickle.dump(vectorizer, fl)
        with open(self.model_file_by_id(model_id), "wb") as fl:
            pickle.dump(model, fl)


    @infer_with_cache
    def infer(self, model_id, items_to_infer, infer_params=None, use_cache=True):
        with open(self.vectorizer_file_by_id(model_id), "rb") as fl:
            vectorizer = pickle.load(fl)
        with open(self.model_file_by_id(model_id), "rb") as fl:
            model = pickle.load(fl)
        language = self.get_language(model_id)
        items_to_infer = [x["text"] for x in items_to_infer]
        last_batch = 0
        predicted = []
        while last_batch < len(items_to_infer):
            batch = items_to_infer[last_batch:last_batch + self.infer_batch_size]
            last_batch += self.infer_batch_size
            batch, _ = self.input_to_features(batch, language=language, train=False, vectorizer=vectorizer)
            predicted.append(model.predict_proba(batch))
        predicted = np.concatenate(predicted, axis=0)

        labels = [int(np.argmax(prediction)) for prediction in predicted]
        scores = [prediction.tolist() for prediction in predicted]
        return {"labels": labels, "scores": scores}

    def model_file_by_id(self, model_id):
        return os.path.join(self.get_model_dir_by_id(model_id), "model")

    def vectorizer_file_by_id(self, model_id):
        return os.path.join(self.get_model_dir_by_id(model_id), "vectorizer")

    def get_models_dir(self):
        return self.model_dir

    @delete_model_cache
    def delete_model(self, model_id):
        logging.info(f"deleting NB model {model_id}")
        model_dir = self.get_model_dir_by_id(model_id)
        if os.path.isdir(model_dir):
            shutil.rmtree(model_dir)


if __name__ == '__main__':
    nb = NaiveBayes(RepresentationType.BOW)
    train_data = [{"text":"I love dogs","label":1},
                  {"text":"I like to play with dogs","label":1},
                  {"text":"dogs are better than cats","label":1},
                  {"text":"cats cats cats","label":0},
                  {"text":"play with cats","label":0},
                  {"text":"dont know","label":0},
                  {"text":"what else","label":0}]
    model_id = nb.train(train_data,None,{})
    res = nb.infer(model_id, [{"text":"I don't know dogs"}],{})
    print(res)
