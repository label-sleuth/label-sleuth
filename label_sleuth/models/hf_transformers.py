#
#  Copyright (c) 2022 IBM Corp.
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#  http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#

from dataclasses import dataclass
from typing import List

from datasets import Dataset
from tqdm.auto import tqdm
from transformers import AutoModelForSequenceClassification, AutoTokenizer, InputFeatures, Trainer, TrainingArguments, \
    TextClassificationPipeline, PreTrainedModel
from transformers.pipelines.pt_utils import KeyDataset

from label_sleuth.models.core.languages import Language
from label_sleuth.models.core.models_background_jobs_manager import ModelsBackgroundJobsManager
from label_sleuth.definitions import GPU_AVAILABLE
from label_sleuth.models.core.model_api import ModelAPI
from label_sleuth.models.core.prediction import Prediction


@dataclass
class TransformerComponents:
    model: PreTrainedModel
    language: Language


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
        super().__init__(output_dir, models_background_jobs_manager, gpu_support=True)
        self.pretrained_model_name = pretrained_model
        self.batch_size = batch_size
        self.learning_rate = learning_rate
        self.num_train_epochs = num_train_epochs
        self.max_seq_length = 128
        self.tokenizer = AutoTokenizer.from_pretrained(self.pretrained_model_name)

    def _train(self, model_id, train_data, model_params: dict):
        texts = [element["text"] for element in train_data]
        labels = [element["label"] for element in train_data]
        train_dataset = self.process_train_inputs(texts, labels)
        training_args = TrainingArguments(output_dir=self.get_models_dir(),
                                          overwrite_output_dir=True,
                                          num_train_epochs=self.num_train_epochs,
                                          per_device_train_batch_size=self.batch_size,
                                          learning_rate=self.learning_rate)
        model = AutoModelForSequenceClassification.from_pretrained(self.pretrained_model_name)
        trainer = Trainer(model=model, args=training_args, train_dataset=train_dataset)
        trainer.train()
        trainer.save_model(self.get_model_dir_by_id(model_id))

    def load_model(self, model_path) -> TransformerComponents:
        language = self.get_language(model_path)
        model = AutoModelForSequenceClassification.from_pretrained(model_path)
        return TransformerComponents(model=model, language=language)

    def infer(self, model_components: TransformerComponents, items_to_infer):
        device = 0 if GPU_AVAILABLE else -1
        pipeline = TextClassificationPipeline(model=model_components.model, tokenizer=self.tokenizer, device=device)

        ds = Dataset.from_dict({'text': [item['text'] for item in items_to_infer]})
        preds = []
        for output in tqdm(pipeline(KeyDataset(ds, 'text'), batch_size=self.batch_size, truncation=True),
                           total=len(items_to_infer), desc="classification inference"):
            preds.append(output)

        scores = [pred['score'] for pred in preds]
        return [Prediction(label=score > 0.5, score=score) for score in scores]

    def get_model_dir_name(self): # for backward compatibility, we override the default get_model_dir_name()
        return "transformers"

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
