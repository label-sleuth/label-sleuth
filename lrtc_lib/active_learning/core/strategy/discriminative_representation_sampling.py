# (c) Copyright IBM Corporation 2020.

# LICENSE: Apache License 2.0 (Apache-2.0)
# http://www.apache.org/licenses/LICENSE-2.0

import numpy as np
import gc

import tensorflow as tf

from lrtc_lib.active_learning.strategies import ActiveLearningStrategies
from lrtc_lib.orchestrator import orchestrator_api
from lrtc_lib.active_learning.active_learning_api import ActiveLearner
from lrtc_lib.data_access.data_access_factory import get_data_access

"""
An implementation of DAL (discriminative active learning), using the learned representation as our representation.
Adapted from https://github.com/dsgissin/DiscriminativeActiveLearning
"""


class DiscriminativeRepresentationSampling(ActiveLearner):

    def __init__(self, max_to_consider=10 ** 6):
        self.max_to_consider = max_to_consider
        self.sub_batches = 5

    def get_strategy(self):
        return ActiveLearningStrategies.DAL

    def get_recommended_items_for_labeling(self, workspace_id, model_id, dataset_name, category_name, sample_size=1):
        data_access = get_data_access()
        unlabeled = self.get_unlabeled_data(workspace_id, dataset_name, category_name, self.max_to_consider)
        if len(unlabeled) == 0:
            return unlabeled

        labeled = data_access.sample_labeled_text_elements(workspace_id, dataset_name, category_name,
                                                           self.max_to_consider)["results"]

        sents_to_infer = labeled + unlabeled
        labeled_idx = np.arange(len(labeled))
        unlabeled_idx = len(labeled) + np.arange(len(unlabeled))
        embeddings = np.array(orchestrator_api.infer(workspace_id, category_name, sents_to_infer)["embeddings"])

        # iteratively sub-sample using the discriminative sampling routine:
        sub_sample_size = int(sample_size / self.sub_batches)
        additional_to_predict_idx = self.get_selected_indices(embeddings, labeled_idx, unlabeled_idx, sample_size,
                                                              sub_sample_size)

        res = np.array(sents_to_infer)[additional_to_predict_idx]
        return res.tolist()

    def get_per_element_score(self, items, workspace_id, model_id, dataset_name, category_name):
        raise NotImplementedError("per element score is not supported by DAL")

    @staticmethod
    def get_selected_indices(train, labeled_idx, unlabeled_idx, sample_size, sub_sample_size):
        selected_unlabeled_idx = np.random.choice(unlabeled_idx, np.min([len(labeled_idx) * 10, len(unlabeled_idx)]),
                                                  replace=False)
        labeled_so_far = 0
        additional_to_predict_idx = []
        while labeled_so_far < sample_size:
            if labeled_so_far + sub_sample_size > sample_size:
                sub_sample_size = sample_size - labeled_so_far

            model = train_discriminative_model(train[labeled_idx], train[selected_unlabeled_idx], len(train[0]))
            idx_to_predict = selected_unlabeled_idx
            predictions = model.predict(train[idx_to_predict])
            selected_indices = np.argpartition(predictions[:, 1], -sub_sample_size)[-sub_sample_size:]
            labeled_so_far += sub_sample_size
            unlabeled_idx = [i for i in unlabeled_idx if i not in idx_to_predict[selected_indices]]
            labeled_idx = np.hstack((labeled_idx, idx_to_predict[selected_indices]))
            additional_to_predict_idx = \
                np.hstack((additional_to_predict_idx, idx_to_predict[selected_indices])).astype(int)
            selected_unlabeled_idx = np.random.choice(unlabeled_idx,
                                                      np.min([len(labeled_idx) * 10, len(unlabeled_idx)]),
                                                      replace=False)

            # if labeled_so_far==sample_size:
            #     additional_to_predict_idx = np.sort(additional_to_predict_idx)
            #     predictions = policy.predict(Train[additional_to_predict_idx])

            # delete the policy to free GPU memory:
            del model
            gc.collect()
        return additional_to_predict_idx


def train_discriminative_model(labeled, unlabeled, input_shape):
    """
    A function that trains and returns a discriminative policy on the labeled and unlabeled data.
    """

    # create the binary dataset:
    y_L = np.zeros((labeled.shape[0], 1), dtype='int')
    y_U = np.ones((unlabeled.shape[0], 1), dtype='int')
    X_train = np.vstack((labeled, unlabeled))
    Y_train = np.vstack((y_L, y_U))
    Y_train = tf.keras.utils.to_categorical(Y_train)

    # build the policy:
    model = get_discriminative_model(input_shape)

    # train the policy:
    batch_size = 100
    epochs = 10
    optimizer = tf.keras.optimizers.Adam(lr=0.0001)

    model.compile(loss='categorical_crossentropy', optimizer=optimizer, metrics=['accuracy'])
    callbacks = [DiscriminativeEarlyStopping()]
    model.fit(X_train, Y_train,
              epochs=epochs,
              batch_size=batch_size,
              shuffle=True,
              callbacks=callbacks,
              class_weight={0: float(X_train.shape[0]) / Y_train[Y_train == 0].shape[0],
                            1: float(X_train.shape[0]) / Y_train[Y_train == 1].shape[0]},
              verbose=2)

    return model


def get_discriminative_model(input_shape):
    """
    The MLP policy for discriminative active learning, without any regularization techniques.
    """
    width = input_shape
    model = tf.keras.Sequential()
    model.add(tf.keras.layers.Dense(width, activation='relu'))
    model.add(tf.keras.layers.Dense(width, activation='relu'))
    model.add(tf.keras.layers.Dense(width, activation='relu'))
    model.add(tf.keras.layers.Dense(2, activation='softmax', name='softmax'))

    return model


class DiscriminativeEarlyStopping(tf.keras.callbacks.Callback):
    """
    A custom callback for discriminative active learning, to stop the training a little bit before the classifier is
    able to get 100% accuracy on the training set. This makes sure examples which are similar to ones already in the
    labeled set won't have a very high confidence.
    """

    def __init__(self, monitor='accuracy', threshold=0.98, verbose=0):
        super(tf.keras.callbacks.Callback, self).__init__()
        self.monitor = monitor
        self.threshold = threshold
        self.verbose = verbose
        self.improved = 0

    def on_epoch_end(self, epoch, logs={}):
        current = logs.get(self.monitor)

        if current > self.threshold:
            if self.verbose > 0:
                print("Epoch {e}: early stopping at accuracy {a}".format(e=epoch, a=current))
            self.model.stop_training = True
