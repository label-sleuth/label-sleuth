import pickle
import shutil
import os
import numpy as np

from sklearn import svm
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.multiclass import OneVsRestClassifier

from lrtc_lib.definitions import ROOT_DIR
from lrtc_lib.train_and_infer_service.languages import Languages
from lrtc_lib.train_and_infer_service.train_and_infer_api import infer_with_cache, \
    delete_model_cache
from lrtc_lib.train_and_infer_service.tools import RepresentationType, get_glove_representation
from lrtc_lib.train_and_infer_service.train_and_infer_with_async import TrainAndInferWithAsync, \
    update_train_status

import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s')

# TODO remove unsupported types (multi-label etc.)
class TrainAndInferSVM(TrainAndInferWithAsync):
    def __init__(self, representations_type: RepresentationType, multi_label=False, async_call=False,
                 model_dir=os.path.join(ROOT_DIR, "output", "models", "svm"), kernel="linear",
                 use_context_features=False):
        super(TrainAndInferSVM, self).__init__(async_call=async_call)
        os.makedirs(model_dir, exist_ok=True)
        self.model_dir = model_dir

        self.kernel = kernel
        self.representation_type = representations_type
        self.multi_label = multi_label
        self.use_context_features = use_context_features

    @update_train_status
    def train_with_async_support(self, model_id, train_data, dev_data, train_params):
        if self.kernel == "linear":
            svm_implementation = svm.LinearSVC()
        elif self.kernel == "rbf":
            logging.warning("Using some arbitrary low gamma, gamma and C values might be better with tuning")
            svm_implementation = svm.SVC(gamma=1e-08)
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

    @infer_with_cache
    def infer(self, model_id, items_to_infer, infer_params=None, use_cache=True):
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
                if self.use_context_features:
                    return create_context_features_from_sparse_vectorizer(texts, vectorizer), vectorizer
                else:
                    return train_data_features, vectorizer
            else:
                if self.use_context_features:
                    return create_context_features_from_sparse_vectorizer(texts, vectorizer), None
                else:
                    return vectorizer.transform(texts), None
        elif self.representation_type == RepresentationType.GLOVE:
            if self.use_context_features:
                main_texts, context_texts = split_to_main_and_context_texts(texts)
                main_reps = get_glove_representation(main_texts, language=language)
                context_reps = get_glove_representation(context_texts, language=language)
                joint_reps = [np.hstack([m, c]) for m, c in zip(main_reps, context_reps)]
                return joint_reps, None
            else:
                return get_glove_representation(texts, language=language), None

    def model_file_by_id(self, model_id):
        return os.path.join(self.get_model_dir_by_id(model_id), "model")

    def vectorizer_file_by_id(self, model_id):
        return os.path.join(self.get_model_dir_by_id(model_id), "vectorizer")

    def get_models_dir(self):
        return self.model_dir

    @delete_model_cache
    def delete_model(self, model_id):
        logging.info(f"deleting SVM model {model_id}")
        model_dir = self.get_model_dir_by_id(model_id)
        if os.path.isdir(model_dir):
            shutil.rmtree(model_dir)


def split_to_main_and_context_texts(texts):
    main_texts = []
    context_texts = []
    for combined_text in texts:
        context_a, main, context_b = combined_text.split('__CONTEXT__')
        main_texts.append(main)
        context_texts.append(' __SEP__ '.join([context_a, context_b]))
    return main_texts, context_texts


def create_context_features_from_sparse_vectorizer(texts, vectorizer):
    main_texts, context_texts = split_to_main_and_context_texts(texts)
    main_reps = vectorizer.transform(main_texts).toarray()
    context_reps = vectorizer.transform(context_texts).toarray()
    return [np.hstack([m, c]) for m, c in zip(main_reps, context_reps)]


# if __name__ == '__main__':
#     import matplotlib.pyplot as plt
#
#     X = [[0, 0], [10, 10], [20, 30], [30, 30], [40, 30], [80, 60], [80, 50]]
#     y = [0, 1, 2, 3, 4, 5, 5]
#     y = [0, 0, 0, 1, 0, 1, 1]
#     model = svm.SVC()
#     model.fit(X, y)
#
#     x_pred = [[10, 10]]
#
#     distances = np.array(model.decision_function(x_pred))  # get distances from hyperplanes (per class)
#     # Binary class may produce only 1 class instead of 2
#     if len(distances.shape) == 1:
#         distances = distances / 2 + 0.5
#         distances = np.expand_dims(distances, 1)
#         distances = np.concatenate([1 - distances, distances], axis=1)
#     prob = np.exp(distances) / np.sum(np.exp(distances), axis=1,
#                                       keepdims=True)  # softmax to convert distances to probabilities
#     classes = model.predict(x_pred)
#     print()


if __name__ == '__main__':

    import uuid
    svm = TrainAndInferSVM(RepresentationType.GLOVE, use_context_features=False)

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

    model_id = svm.train(train_data, None, None, {})
    infer_list = []
    for x in range(3):
        # infer_list.append({"text": "hello " + str(uuid.uuid4()) + str(x)})
        infer_list.append({"text": "some context__CONTEXT__hello " + str(uuid.uuid4()) + str(x) + "__CONTEXT__some other context"})
    res = svm.infer(model_id, infer_list, {})
    print(res)
