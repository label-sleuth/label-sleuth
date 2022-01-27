import logging
import gc
import os
import shutil

import torch
import tqdm
from transformers import AutoModelForSequenceClassification, AutoTokenizer, InputFeatures, Trainer, TrainingArguments

from lrtc_lib.definitions import ROOT_DIR
from lrtc_lib.models.core.model_api import ModelAPI

MODEL_DIR = os.path.join(ROOT_DIR, "output", "models", "transformers")


class HFTransformers(ModelAPI):
    def __init__(self, pretrained_model="bert-base-uncased", batch_size=32, learning_rate=5e-5, model_dir=MODEL_DIR):
        """
        :param pretrained_model:
        :param batch_size:
        :param learning_rate:
        :param model_dir:

        """
        super().__init__()
        if not os.path.isdir(model_dir):
            os.makedirs(model_dir)
        self.pretrained_model_name = pretrained_model
        self.batch_size = batch_size
        self.learning_rate = learning_rate
        self.max_seq_length = 128
        self.tokenizer = AutoTokenizer.from_pretrained(self.pretrained_model_name)
        self.device = "cuda:0" if torch.cuda.is_available() else "cpu"

    def _train(self, model_id, train_data, train_params: dict):
        texts = [element["text"] for element in train_data]
        labels = [element["label"] for element in train_data]
        train_dataset = self.process_inputs(texts, labels)
        training_args = TrainingArguments(output_dir=MODEL_DIR,
                                          overwrite_output_dir=True,
                                          num_train_epochs=5,
                                          per_device_train_batch_size=self.batch_size,
                                          learning_rate=self.learning_rate)
        model = AutoModelForSequenceClassification.from_pretrained(self.pretrained_model_name)
        trainer = Trainer(model=model,
                          args=training_args,
                          train_dataset=train_dataset)
        trainer.train()
        trainer.save_model(self.get_model_dir_by_id(model_id))


    def _infer(self, model_id, items_to_infer, infer_params=None):
        model_path = self.get_model_dir_by_id(model_id)
        model = AutoModelForSequenceClassification.from_pretrained(model_path).to(self.device)
        preds = []
        for x in tqdm.tqdm(range(0, len(items_to_infer), self.batch_size)):
            batch_texts = [x['text'] for x in items_to_infer[x:x + self.batch_size]]
            batch_input = self.tokenizer.batch_encode_plus(batch_texts, max_length=self.max_seq_length, padding=True,
                                                           truncation=True, return_tensors='pt').to(self.device)
            batch_res = model(**batch_input).logits.softmax(-1).detach().cpu()
            preds.extend(batch_res)
            del batch_res, batch_input
            gc.collect()
            torch.cuda.empty_cache()

        scores = [pred.squeeze().numpy().tolist() for pred in preds]
        labels = [int(example_scores[1] > 0.5) for example_scores in scores]
        return {"labels": labels, "scores": scores}

    def get_models_dir(self):
        return MODEL_DIR

    def process_inputs(self, texts, labels):
        tokenized = []
        for text, label in zip(texts, labels):
            inputs = (self.tokenizer.encode_plus(text, add_special_tokens=True, max_length=self.max_seq_length,
                                                 pad_to_max_length=True))

            tokenized.append(InputFeatures(input_ids=inputs['input_ids'],
                                           attention_mask=inputs['attention_mask'],
                                           token_type_ids=inputs['token_type_ids'],
                                           label=label))
        return tokenized


if __name__ == '__main__':
    model = HFTransformers(batch_size=32)

    train_data = [{"text": "I love dogs", "label": 1},
                  {"text": "I like to play with dogs", "label": 1},
                  {"text": "dogs are better than cats", "label": 1},
                  {"text": "cats cats cats", "label": 0},
                  {"text": "play with cats", "label": 0},
                  {"text": "dont know", "label": 0},
                  {"text": "what else", "label": 0}]

    import uuid

    model_id = model.train(train_data, {})
    print(model_id)
    infer_list = []
    for x in range(3):
        infer_list.append({"text": "hello " + str(uuid.uuid4()) + str(x)})
    res = model.infer(model_id, infer_list, {})
    print(res)
