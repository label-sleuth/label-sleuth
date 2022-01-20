import numpy as np
import gc

from lrtc_lib.active_learning.strategies import ActiveLearningStrategies
from lrtc_lib.active_learning.core.strategy.perceptron_ensemble import PerceptronEnsemble, \
    train_perceptron_ensemble_model


class PerceptronDropout(PerceptronEnsemble):

    def __init__(self, n_units=10, max_to_consider=10 ** 6):
        super().__init__(n_units, max_to_consider)

    def get_strategy(self):
        return ActiveLearningStrategies.DROPOUT_PERCEPTRON

    def get_per_model_predictions(self, pos, neg, infer):
        model = train_perceptron_ensemble_model(pos, neg, n_units=1)[0]
        per_model_predictions = [self.dropout_predict(infer, model) for _ in range(self.n_units)]
        del model
        gc.collect()
        return per_model_predictions

    def dropout_predict(self, infer, model):
        import tensorflow.python.keras.backend as K  # see https://github.com/tensorflow/tensorflow/issues/34201
        f = K.function([model.layers[0].input, K.symbolic_learning_phase()],
                       [model.layers[-1].output])
        return f([infer, True])[0]


if __name__ == '__main__':
    pos = np.random.rand(100, 50)
    neg = np.random.rand(100, 50)
    infer = np.random.rand(150, 50)

    ped = PerceptronDropout(n_units=10)
    print(ped.get_scores_from_embeddings(pos, neg, infer))
