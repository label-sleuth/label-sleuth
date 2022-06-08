import gc
import os

from typing import List

import torch
import tqdm

from transformers import AutoModelForSequenceClassification, AutoTokenizer, InputFeatures, Trainer, TrainingArguments

from label_sleuth.models.core.models_background_jobs_manager import ModelsBackgroundJobsManager
from label_sleuth.definitions import GPU_AVAILABLE
from label_sleuth.models.core.model_api import ModelAPI
from label_sleuth.models.core.prediction import Prediction


class HFTransformers(ModelAPI):
    """
    Basic implementation for a pytorch-based transformer model that relies on the huggingface transformers library.
    """
    def __init__(self, output_dir, models_background_jobs_manager: ModelsBackgroundJobsManager,
                 pretrained_model="bert-base-uncased", batch_size=32, learning_rate=5e-5, num_train_epochs=5):
        """
        :param output_dir:
        :param models_background_jobs_manager:
        :param pretrained_model: the name of a transfomer model from huggingface.co, or a path to a directory containing
        a pytorch model created using the huggingface transformers library
        :param batch_size:
        :param learning_rate:
        :param num_train_epochs:
        """
        super().__init__(models_background_jobs_manager, gpu_support=True)
        self.model_dir = os.path.join(output_dir, "transformers")
        os.makedirs(self.model_dir, exist_ok=True)
        self.pretrained_model_name = pretrained_model
        self.batch_size = batch_size
        self.learning_rate = learning_rate
        self.num_train_epochs = num_train_epochs
        self.max_seq_length = 128
        self.tokenizer = AutoTokenizer.from_pretrained(self.pretrained_model_name)

    def _train(self, model_id, train_data, train_params: dict):
        texts = [element["text"] for element in train_data]
        labels = [element["label"] for element in train_data]
        train_dataset = self.process_train_inputs(texts, labels)
        training_args = TrainingArguments(output_dir=self.model_dir,
                                          overwrite_output_dir=True,
                                          num_train_epochs=self.num_train_epochs,
                                          per_device_train_batch_size=self.batch_size,
                                          learning_rate=self.learning_rate)
        model = AutoModelForSequenceClassification.from_pretrained(self.pretrained_model_name)
        trainer = Trainer(model=model, args=training_args, train_dataset=train_dataset)
        trainer.train()
        trainer.save_model(self.get_model_dir_by_id(model_id))

    def _infer(self, model_id, items_to_infer):
        device = "cuda:0" if GPU_AVAILABLE else "cpu"
        model_path = self.get_model_dir_by_id(model_id)
        model = AutoModelForSequenceClassification.from_pretrained(model_path).to(device)
        preds = []
        for x in tqdm.tqdm(range(0, len(items_to_infer), self.batch_size)):
            batch_texts = [x['text'] for x in items_to_infer[x:x + self.batch_size]]
            batch_input = self.tokenizer.batch_encode_plus(batch_texts, max_length=self.max_seq_length, padding=True,
                                                           truncation=True, return_tensors='pt').to(device)
            batch_res = model(**batch_input).logits.softmax(-1).detach().cpu()
            preds.extend(batch_res)
            del batch_res, batch_input
            gc.collect()
            torch.cuda.empty_cache()

        # The True label is in the second position as sorted([True, False]) is [False, True]
        scores = [pred.squeeze().numpy()[1] for pred in preds]
        return [Prediction(label=score > 0.5, score=score) for score in scores]

    def get_models_dir(self):
        return self.model_dir

    def process_train_inputs(self, texts, labels) -> List[InputFeatures]:
        """
        Tokenize the train texts and return training data in a format expected by the transformers library.
        If the desired transformer model requires different inputs than input_ids+attention_mask+token_type_ids, this
        function may need to be overriden.
        :param texts:
        :param labels:
        :return: a list of transformers library InputFeatures
        """
        features = []
        for text, label in zip(texts, labels):
            inputs = (self.tokenizer.encode_plus(text, add_special_tokens=True, max_length=self.max_seq_length,
                                                 pad_to_max_length=True))

            features.append(InputFeatures(input_ids=inputs['input_ids'],
                                          attention_mask=inputs['attention_mask'],
                                          token_type_ids=inputs['token_type_ids'],
                                          label=label))
        return features
