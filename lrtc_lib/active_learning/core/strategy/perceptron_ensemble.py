# (c) Copyright IBM Corporation 2020.

# LICENSE: Apache License 2.0 (Apache-2.0)
# http://www.apache.org/licenses/LICENSE-2.0

import numpy as np
import gc

from lrtc_lib.active_learning.strategies import ActiveLearningStrategies
from lrtc_lib.active_learning.active_learning_api import ActiveLearner
from lrtc_lib.data_access.data_access_factory import get_data_access


class PerceptronEnsemble(ActiveLearner):

    def __init__(self, n_units, max_to_consider=10 ** 6):
        self.max_to_consider = max_to_consider
        self.n_units = n_units

    def get_strategy(self):
        return ActiveLearningStrategies.PERCEPTRON_ENSEMBLE

    def get_recommended_items_for_labeling(self, workspace_id, model_id, dataset_name, category_name, sample_size=1):
        unlabeled = self.get_unlabeled_data(workspace_id, dataset_name, category_name, self.max_to_consider)
        if len(unlabeled) == 0:
            return unlabeled

        scores = self.get_per_element_score(unlabeled, workspace_id, model_id, dataset_name, category_name)
        selected_idx = list(reversed(np.argsort(scores)[-sample_size:]))
        res = np.array(unlabeled)[selected_idx]
        return res.tolist()

    def get_scores_from_embeddings(self, pos, neg, infer):
        per_model_predictions = self.get_per_model_predictions(pos, neg, infer)
        mean_predictions = np.mean(per_model_predictions, axis=0)
        unlabeled_predictions = -np.sum(mean_predictions * np.log(mean_predictions + 1e-10), axis=1)
        return unlabeled_predictions

    def get_per_model_predictions(self, pos, neg, infer):
        models = train_perceptron_ensemble_model(pos, neg, n_units=self.n_units)
        per_model_predictions = [model.predict(infer) for model in models]
        del models
        gc.collect()
        return per_model_predictions

    def get_per_element_score(self, items, workspace_id, model_id, dataset_name, category_name):
        from lrtc_lib.orchestrator import orchestrator_api
        data_access = get_data_access()
        labeled = data_access.sample_labeled_text_elements(workspace_id, dataset_name, category_name,
                                                           self.max_to_consider)["results"]
        train_embeddings = np.array(orchestrator_api.infer(workspace_id, category_name, labeled)["embeddings"])
        unlabeled_embeddings = np.array(orchestrator_api.infer(workspace_id, category_name, items)["embeddings"])
        pos_idx = get_pos_idx(category_name, labeled)
        pos = train_embeddings[pos_idx]
        neg = train_embeddings[[i for i in range(len(train_embeddings)) if i not in pos_idx]]
        scores = self.get_scores_from_embeddings(pos, neg, unlabeled_embeddings)
        return scores


def train_perceptron_ensemble_model(pos, neg, n_units=1):
    import tensorflow as tf
    # create the binary dataset:
    y_pos = np.zeros((neg.shape[0], 1), dtype='int')
    y_neg = np.ones((pos.shape[0], 1), dtype='int')
    X_train = np.vstack((pos, neg))
    Y_train = np.vstack((y_pos, y_neg))
    Y_train = tf.keras.utils.to_categorical(Y_train)

    batch_size = 50
    epochs = 10
    optimizer = tf.keras.optimizers.Adam(lr=0.0001)

    def get_model():
        model = get_perceptron_model(len(pos[0]))
        # train the policy:
        model.compile(loss='categorical_crossentropy', optimizer=optimizer, metrics=['accuracy'])
        model.fit(X_train, Y_train,
                  epochs=epochs,
                  batch_size=batch_size,
                  shuffle=True,
                  class_weight={0: float(X_train.shape[0]) / Y_train[Y_train == 0].shape[0],
                                1: float(X_train.shape[0]) / Y_train[Y_train == 1].shape[0]},
                  verbose=2)

        return model

    def get_perceptron_model(input_shape):
        width = input_shape
        model = tf.keras.Sequential()
        model.add(tf.keras.layers.Dropout(0.9, input_shape=(width,)))  # this dropout applies only on training phase!
        model.add(tf.keras.layers.Dense(2, activation='softmax', name='softmax'))
        return model

    return [get_model() for _ in range(n_units)]


def get_pos_idx(category_name, labeled):
    from lrtc_lib.orchestrator.orchestrator_api import LABEL_POSITIVE
    pos_idx = [i for i, sentence in enumerate(labeled)
               if LABEL_POSITIVE in sentence.category_to_label[category_name].labels]
    return pos_idx


if __name__ == '__main__':
    pos = np.random.rand(100, 768)
    neg = np.random.rand(100, 768)
    infer = np.random.rand(15000, 768)
    ped = PerceptronEnsemble(n_units=10)
    print(ped.get_scores_from_embeddings(pos, neg, infer))
