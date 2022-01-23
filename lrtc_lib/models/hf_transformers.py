import logging
import os
import pickle
import shutil
import uuid

import numpy as np
import tensorflow as tf
from itertools import repeat

from scipy.special import softmax
from tensorflow.python.distribute import parameter_server_strategy
from tensorflow.python.keras.callbacks import EarlyStopping, ModelCheckpoint
from tensorflow.python.keras.engine import data_adapter
from transformers import BertTokenizer, TFBertForSequenceClassification, InputFeatures

from tensorflow.keras import backend as K

from lrtc_lib.definitions import ROOT_DIR
from lrtc_lib.models.core.model_api import infer_with_cache, ModelStatus, ModelAPI

MODEL_DIR = os.path.join(ROOT_DIR, "output", "models", "transformers")
HF_CACHE_DIR = os.path.join(ROOT_DIR, "output", "temp", "hf_cache")


class HFTransformers(ModelAPI):
    def __init__(self, batch_size, infer_batch_size=10, learning_rate=5e-5, debug=False, model_dir=MODEL_DIR,
                 infer_with_cls=False):
        """
        :param batch_size:
        :param infer_batch_size:
        :param learning_rate:
        :param debug:
        :param model_dir:
        :param infer_with_cls: If true, the embeddings output at inference is the embedding for the cls token in the
        last hidden later. Otherwise, the embeddings output is the output after pooling, i.e. just before the final
        classifier layer.
        """
        super(HFTransformers, self).__init__()
        self.infer_with_cls = infer_with_cls
        if not os.path.isdir(model_dir):
            os.makedirs(model_dir)
        self.model_dir = model_dir
        # Load dataset, tokenizer, model from pretrained model/vocabulary
        self.tokenizer = self.get_tokenizer()
        # Prepare training: Compile tf.keras model with optimizer, loss and learning rate schedule
        self.learning_rate = learning_rate
        self.max_length = 100
        self.batch_size = batch_size
        if infer_batch_size == -1:
            self.infer_batch_size = batch_size
        else:
            self.infer_batch_size = infer_batch_size
        self.debug = debug
        self.model_id = -1

    def __getstate__(self):
        ignore_list = {"tokenizer"}
        return {key: val for key, val in self.__dict__.items() if key not in ignore_list}

    def __setstate__(self, d):
        self.__dict__ = d
        self.__dict__["tokenizer"] = self.get_tokenizer()

    def get_tokenizer(self):
        return BertTokenizer.from_pretrained('bert-base-uncased', cache_dir=HF_CACHE_DIR)

    def process_inputs(self, texts, labels=None, to_dataset=True):
        """
        convert text to tf dataset used as model input (e.g. for training)
        """
        if labels is None:
            labels = repeat(0)

        # tokenize
        tokenized = []
        for text, label in zip(texts, labels):
            inputs = (self.tokenizer.encode_plus(text, add_special_tokens=True, max_length=self.max_length,
                                                 pad_to_max_length=True))

            tokenized.append(InputFeatures(input_ids=inputs['input_ids'],
                                           attention_mask=inputs['attention_mask'],
                                           token_type_ids=inputs['token_type_ids'],
                                           label=label))

        if to_dataset:
            tokenized = self.to_dataset(tokenized)
        return tokenized

    def train(self, train_data, dev_data, train_params: dict) -> str:
        logging.info("Training hf model...")
        model_id = str(uuid.uuid1())
        self.model_id = model_id
        epochs = 5

        train_file = self.train_file_by_id(self.model_id)
        model_dir = self.get_model_dir_by_id(self.model_id)
        params_file = self.params_file_by_id(self.model_id)
        try:
            with open(train_file, "w") as fl:
                fl.write("")

            # init
            model = TFBertForSequenceClassification.from_pretrained('bert-base-uncased', cache_dir=HF_CACHE_DIR)
            model.config.output_hidden_states = True
            optimizer = tf.keras.optimizers.Adam(learning_rate=self.learning_rate, epsilon=1e-06)
            loss = tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True)
            if "metric" in train_params:
                metric_name = train_params["metric"]
                if metric_name == "accuracy":
                    metric = tf.keras.metrics.SparseCategoricalAccuracy(metric_name)
                elif metric_name == "precision":
                    metric = tf.keras.metrics.Precision(metric_name)
                elif metric_name == "f1":
                    metric = SparseF1(num_classes=2, class_id=1, name=metric_name)
                else:
                    raise ValueError(f"metric {metric_name} is not supported.")
            else:
                # This is the default metric
                metric = tf.keras.metrics.SparseCategoricalAccuracy('accuracy')
            model.compile(optimizer=optimizer, loss=loss, metrics=[metric])

            # Train the model using the training sets
            if self.debug:
                train_data = train_data[:self.batch_size]
                dev_data = dev_data[:self.batch_size]
            texts = [element["text"] for element in train_data]
            labels = [element["label"] for element in train_data]
            inputs = self.process_inputs(texts, labels)
            inputs = inputs.shuffle(self.batch_size * 100).batch(self.batch_size)
            dev_texts = [element["text"] for element in dev_data]
            dev_labels = [element["label"] for element in dev_data]
            dev_input = self.process_inputs(dev_texts, dev_labels)
            dev_input = dev_input.batch(self.infer_batch_size)

            os.makedirs(model_dir)
            model_checkpoint = ModelCheckpoint(model_dir, save_best_only=True, save_weights_only=True)
            early_stopping = EarlyStopping(monitor="val_" + metric_name, patience=epochs)
            history = model.fit(x=input, validation_data=dev_input, epochs=epochs,
                                callbacks=[early_stopping, model_checkpoint])
            with open(params_file, "wb") as fl:
                pickle.dump(self, fl)
            model.save_pretrained(model_dir)
        except Exception as e:
            self.delete_model(self.model_id)
            raise e
        finally:
            if os.path.isfile(train_file):
                os.remove(train_file)
            logging.info("Training done")
        return self.model_id

    @infer_with_cache
    def infer(self, model_id, items_to_infer, infer_params: dict, use_cache=True):
        logging.info("Inferring with hf model...")
        items_to_infer = [x["text"] for x in items_to_infer]
        model = TFBertForSequenceClassification.from_pretrained(self.get_model_dir_by_id(model_id))

        if self.debug:
            items_to_infer = items_to_infer[:self.infer_batch_size]

        input = self.process_inputs(items_to_infer).batch(self.infer_batch_size)
        if self.infer_with_cls:  # get embeddings for CLS token in last hidden layer
            outputs = [model(inp[0]) for inp in input]
            logits = tf.concat([output[0] for output in outputs], axis=0)
            hidden_states = tf.concat([output[1] for output in outputs], axis=1)
            embeddings = hidden_states[-1]  # 0=embedding x=embedding at layer x, only last layer is interesting
            out_emb = embeddings[:, 0, :]
        else:  # get embeddings from pooled output, following the logic of TFBertForSequenceClassification "call" func
            outputs = [model.bert(inp[0]) for inp in input]
            out_emb = tf.concat([output[1] for output in outputs], axis=0)
            pooled_output = model.dropout(out_emb, training=False)
            logits = model.classifier(pooled_output)
        labels = [int(np.argmax(logit)) for logit in logits]
        predictions = softmax(logits, axis=1)
        scores = [float(prediction[label]) for label, prediction in zip(labels, predictions)]
        logging.info("Infer hf model done")
        return {"labels": labels, "scores": scores, "logits": logits.numpy().tolist(),
                "embeddings": out_emb.numpy().tolist()}

    def get_model_status(self, model_id) -> ModelStatus:
        """
        returns the model status defined in the ModelStatus enum.
        """
        if os.path.isfile(self.train_file_by_id(model_id)):
            if not os.path.isdir(self.get_model_dir_by_id(model_id)):
                return ModelStatus.TRAINING
            else:
                return ModelStatus.READY
        elif os.path.isdir(self.get_model_dir_by_id(model_id)):
            return ModelStatus.READY
        return ModelStatus.ERROR

    def get_models_dir(self):
        return MODEL_DIR

    def delete_model(self, model_id):
        """
        deletes model files
        """
        train_file = self.train_file_by_id(model_id)
        model_dir = self.get_model_dir_by_id(model_id)
        params_file = self.params_file_by_id(model_id)
        if os.path.isfile(train_file):
            os.remove(train_file)
        if os.path.isdir(model_dir):
            shutil.rmtree(model_dir)
        if os.path.isfile(params_file):
            os.remove(params_file)

    def to_dataset(self, features):
        """
        Converts an iterator of features to a tf dataset
        """
        def gen():
            for ex in features:
                yield ({'input_ids': ex.input_ids,
                        'attention_mask': ex.attention_mask,
                        'token_type_ids': ex.token_type_ids},
                       ex.label)

        return tf.data.Dataset.from_generator(gen,
                                              ({'input_ids': tf.int32,
                                                'attention_mask': tf.int32,
                                                'token_type_ids': tf.int32},
                                               tf.int64),
                                              ({'input_ids': tf.TensorShape([None]),
                                                'attention_mask': tf.TensorShape([None]),
                                                'token_type_ids': tf.TensorShape([None])},
                                               tf.TensorShape([])))

    def get_model_dir_by_id(self, model_id):
        return os.path.join(self.get_models_dir(), model_id)

    def train_file_by_id(self, model_id):
        return os.path.join(self.get_models_dir(), "training_" + model_id)

    def params_file_by_id(self, model_id):
        return os.path.join(self.get_models_dir(), "HFparams_" + model_id)


def _get_grads_graph(model, x, y, params, sample_weight=None, learning_phase=0, relevant_output=None):
    sample_weight = sample_weight or np.ones(len(x))

    outputs = model.optimizer.get_gradients(model.total_loss, params)
    if relevant_output is not None:
        outputs = outputs[relevant_output]
    inputs = (model.inputs + model._feed_targets + model._feed_sample_weights
              + [K.learning_phase()])

    grads_fn = K.function(inputs, outputs)
    gradients = grads_fn([x, y, sample_weight, learning_phase])
    return gradients


def _get_grads_eager(model, x, y, params, sample_weight=None, learning_phase=0, relevant_output=None):
    def _process_input_data(x, y, sample_weight, model):
        iterator = data_adapter.single_batch_iterator(model.distribute_strategy,
                                                      x, y, sample_weight,
                                                      class_weight=None)
        data = next(iterator)
        data = data_adapter.expand_1d(data)
        x, y, sample_weight = data_adapter.unpack_x_y_sample_weight(data)
        return x, y, sample_weight

    def _clip_scale_grads(strategy, tape, optimizer, loss, params):
        from tensorflow.python.keras.mixed_precision import loss_scale_optimizer as lso
        with tape:
            if isinstance(optimizer, lso.LossScaleOptimizer):
                loss = optimizer.get_scaled_loss(loss)

        gradients = tape.gradient(loss, params)

        aggregate_grads_outside_optimizer = (
                optimizer._HAS_AGGREGATE_GRAD and not isinstance(
            strategy.extended,
            parameter_server_strategy.ParameterServerStrategyExtended))

        if aggregate_grads_outside_optimizer:
            gradients = optimizer._aggregate_gradients(zip(gradients, params))
        # if isinstance(optimizer, lso.LossScaleOptimizer):
        #     gradients = optimizer.get_unscaled_gradients(gradients)

        gradients = optimizer._clip_gradients(gradients)
        return gradients

    x, y, sample_weight = _process_input_data(x, y, sample_weight, model)

    with tf.GradientTape() as tape:
        y_pred = model(x, training=bool(learning_phase))
        if relevant_output is not None:
            y_pred = y_pred[relevant_output]
        loss = model.compiled_loss(y, y_pred, sample_weight,
                                   regularization_losses=model.losses)

    gradients = _clip_scale_grads(model.distribute_strategy, tape,
                                  model.optimizer, loss, params)
    res = []
    for grad in gradients:
        if isinstance(grad, tf.IndexedSlices):
            res.append(grad.values)
        else:
            res.append(grad.numpy())
    return gradients


def get_gradients(model, x, y, params, sample_weight=None, learning_phase=0, relevant_output=None):
    """
    Returns the gradient of a model given input x and required output y.
    Note: works both in eager and graph execution. Graph execution is generally faster.
    Based on github.com/OverLordGoldDragon/see-rnn
    """
    if tf.executing_eagerly():
        return _get_grads_eager(model, x, y, params, sample_weight,
                                learning_phase, relevant_output)
    else:
        return _get_grads_graph(model, x, y, params, sample_weight,
                                learning_phase, relevant_output)


class SparseConfusionMatrix(tf.keras.metrics.Metric):
    def __init__(self, name, num_classes, class_id, **kwargs):
        class_suffix = '' if num_classes == 2 and class_id == 1 else f'_{class_id}'
        super(SparseConfusionMatrix, self).__init__(name=f'{name}{class_suffix}', **kwargs)
        self.num_classes = num_classes
        self.class_id = class_id
        self.true_positives = self.add_weight('true_pos', shape=(num_classes,), initializer='zeros', dtype=tf.int32)
        self.false_positives = self.add_weight('false_pos', shape=(num_classes,), initializer='zeros', dtype=tf.int32)
        self.true_negatives = self.add_weight('true_neg', shape=(num_classes,), initializer='zeros', dtype=tf.int32)
        self.false_negatives = self.add_weight('false_neg', shape=(num_classes,), initializer='zeros', dtype=tf.int32)

    def _update(self, cond, var):
        ndim = len(cond.shape.dims)
        values = tf.reduce_sum(tf.cast(cond, tf.int32), axis=list(range(ndim - 1)))
        var.assign_add(values)

    def update_state(self, y_true, y_pred, sample_weight=None):
        y_pred_rank = y_pred.shape.ndims
        y_true_rank = y_true.shape.ndims
        # If the shape of y_true is (num_samples, 1), squeeze to (num_samples,)
        if (y_true_rank is not None) and (y_pred_rank is not None) and (
                len(K.int_shape(y_true)) == len(K.int_shape(y_pred))):
            y_true = tf.squeeze(y_true, [-1])

        y_true = tf.one_hot(tf.cast(y_true, tf.int32), depth=self.num_classes)
        y_pred = tf.one_hot(tf.argmax(y_pred, axis=-1), depth=self.num_classes)

        ones = tf.ones_like(y_true)
        zeros = tf.zeros_like(y_true)

        tp_cond = tf.logical_and(tf.equal(y_true, ones), tf.equal(y_pred, ones))
        fp_cond = tf.logical_and(tf.equal(y_true, zeros), tf.equal(y_pred, ones))
        tn_cond = tf.logical_and(tf.equal(y_true, zeros), tf.equal(y_pred, zeros))
        fn_cond = tf.logical_and(tf.equal(y_true, ones), tf.equal(y_pred, zeros))

        self._update(tp_cond, self.true_positives)
        self._update(fp_cond, self.false_positives)
        self._update(tn_cond, self.true_negatives)
        self._update(fn_cond, self.false_negatives)

    def reset_states(self):
        for v in self.variables:
            v.assign(tf.zeros_like(v))

    def _get_class_result(self):
        return {
            'tp': self.true_positives[self.class_id],
            'fp': self.false_positives[self.class_id],
            'tn': self.true_negatives[self.class_id],
            'fn': self.false_negatives[self.class_id],
        }

    def result(self):
        raise NotImplementedError()


class SparseF1(SparseConfusionMatrix):
    def __init__(self, num_classes, class_id, name='f1', **kwargs):
        super().__init__(name, num_classes, class_id, dtype=tf.float32, **kwargs)

    def result(self):
        counts = self._get_class_result()
        tp = tf.cast(counts['tp'], tf.float32)
        fp = tf.cast(counts['fp'], tf.float32)
        fn = tf.cast(counts['fn'], tf.float32)
        precision = tf.math.divide_no_nan(tp, tp + fp)
        recall = tf.math.divide_no_nan(tp, tp + fn)
        f1 = tf.math.divide_no_nan(2 * precision * recall, precision + recall)
        return f1
