import gc
import os

import torch
import tqdm

from transformers import AutoModelForSequenceClassification, AutoTokenizer, InputFeatures, Trainer, TrainingArguments

from lrtc_lib.models.core.models_background_jobs_manager import ModelsBackgroundJobsManager
from lrtc_lib.definitions import ROOT_DIR, GPU_AVAILABLE
from lrtc_lib.models.core.model_api import ModelAPI
from lrtc_lib.models.core.prediction import Prediction


class HFTransformers(ModelAPI):
    """
    Basic implementation for a pytorch-based transformer model that relies on the huggingface transformers library.
    """
    def __init__(self, models_background_jobs_manager: ModelsBackgroundJobsManager,
                 pretrained_model="bert-base-uncased", batch_size=32, learning_rate=5e-5, num_train_epochs=5,
                 model_dir=os.path.join(ROOT_DIR, "output", "models", "transformers")):
        """
        :param pretrained_model: the name of a transfomer model from huggingface.co, or a path to a directory containing
        a pytorch model created using the huggingface transformers library
        :param batch_size:
        :param learning_rate:
        :param num_train_epochs:
        :param model_dir:
        """
        super().__init__(models_background_jobs_manager, gpu_support=True)
        if not os.path.isdir(model_dir):
            os.makedirs(model_dir)
        self.model_dir = model_dir
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

    def process_train_inputs(self, texts, labels):
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


if __name__ == '__main__':
    model = HFTransformers(ModelsBackgroundJobsManager(), batch_size=32, num_train_epochs=2)

    train_data = [{"text": "I love dogs", "label": True},
                  {"text": "I like to play with dogs", "label": True},
                  {"text": "dogs are better than cats", "label": True},
                  {"text": "cats cats cats", "label": False},
                  {"text": "play with cats", "label": False},
                  {"text": "dont know", "label": False},
                  {"text": "what else", "label": False}]


    import uuid

    model_id, future = model.train(train_data, {})
    print(model_id)
    infer_list = []
    for x in range(3):
        infer_list.append({"text": "hello " + str(uuid.uuid4()) + str(x)})
    infer_list.append({"text":"I really love dogs"})

    future.result()
    res = model.infer(model_id, infer_list, {})
    print(res)
