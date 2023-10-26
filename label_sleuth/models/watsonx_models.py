# pip install ibm-generative-ai===0.1.15
import abc
import ast
import os
import logging
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from abc import ABC, abstractmethod, ABCMeta
from enum import Enum

import numpy
import requests
from genai.schemas.responses import GenerateResponse
from label_sleuth.orchestrator.background_jobs_manager import BackgroundJobsManager

logging.basicConfig(level=os.environ.get("LOGLEVEL", "DEBUG"))
from dotenv import load_dotenv

from genai.model import Credentials, Model
from genai.schemas import GenerateParams, ModelType
from typing import Set, Sequence, Mapping, List, Union
import json

from label_sleuth.models.core.languages import Language, Languages
from label_sleuth.models.core.model_api import ModelAPI, ModelStatus
from label_sleuth.models.core.prediction import Prediction, MulticlassPrediction
from transformers import AutoTokenizer

from ibm_watson_machine_learning.foundation_models import Model as wxModel
from ibm_watson_machine_learning.metanames import GenTextParamsMetaNames as GenParams
from ibm_watson_machine_learning.foundation_models.utils.enums import ModelTypes


@dataclass
class WatsonXModelComponents:
    category_name: str
    positive_texts: List[str]
    negative_texts: List[str]
    available_tokens: int

@dataclass
class WatsonXMultiClassModelComponent:
    category_name: str
    positive_texts: List[str]
    negative_texts: List[str]
    available_tokens: int
    category_name_to_id: dict


class PromptType(Enum):
    YES_NO = 0
    CLS_NO_CLS = 1
    MULTICLASS = 2


bam_model_type_to_watsonx_model_type = {ModelType.FLAN_T5_11B:ModelTypes.FLAN_T5_XXL,
                                        ModelType.FLAN_UL2_20B:ModelTypes.FLAN_UL2}

bam_model_type_to_str_model_name = {ModelType.FLAN_T5_11B: "google/flan-t5-xxl",
                                    ModelType.FLAN_T5_3B: "google/flan-t5-xl",
                                    ModelType.FLAN_UL2_20B: "google/flan-ul2"}
watsonx_model_type_to_max_seq_length = {
            ModelType.FLAN_UL2_20B: 4096,
            ModelType.FLAN_T5_3B: 4096,
            ModelType.FLAN_T5_11B: 4096,
            ModelType.GPT_NEOX_20B: 8192,
            # MPT-7b is still not defined, but if it will the size is 2048
        }

cash_api_name_to_endpoint = {
    "BAM":"https://bam-api.res.ibm.com/v1",
    "WATSON-AI-PREVIEW": "https://us-south.ml.cloud.ibm.com",
    "WATSON-AI-PROD": "https://us-south.ml.cloud.ibm.com"
}



class Multiclass_Verbalizer():
    @staticmethod
    def get_class_names_verbalizer(class_names):
        instruction = 'classify { ' + ", ".join(['"' + c + '"' for c in class_names]) + ' }'
        input_prefix = 'Input: '
        output_prefix = 'Output: '
        verbalizer = instruction + ' ' + input_prefix + ' {{input}} ' + output_prefix
        return verbalizer

    @staticmethod
    def get_no_class_names_verbalizer():
        instruction = 'classify the following text: '
        input_prefix = 'Input: '
        output_prefix = 'Output: '
        verbalizer = instruction + ' ' + input_prefix + ' {{input}} ' + output_prefix
        return verbalizer

    @staticmethod
    def get_instruction(tokenizer, train_seq_len, category_names):
        tokenizer = tokenizer
        verbalizer = Multiclass_Verbalizer.get_class_names_verbalizer(category_names)
        verbalizer_len = len(tokenizer(verbalizer.replace("{{input}}", ""))["input_ids"])
        if verbalizer_len > train_seq_len:
            logging.info(
                "The verbalizer itself is longer than the permitted token limit. We fallback to the generic verbalizer.")
            verbalizer = Multiclass_Verbalizer.get_no_class_names_verbalizer()
        return verbalizer

class PromptTuningAPI(object, metaclass=ABCMeta):

    def __init__(self, watsonx_model):
        self.watsonx_model = watsonx_model

    @abstractmethod
    def train(self, model_id: str, train_data: Sequence[Mapping], model_params: Mapping):
        raise NotImplementedError


class PromptEngineering(PromptTuningAPI):
    def __init__(self, watsonx_model):
        super(PromptEngineering, self).__init__(watsonx_model)

    def train(self, model_id: str, train_data: Sequence[Mapping], model_params: Mapping):
        if len(train_data) > 0:
            train_data_index = 0
            positive_pool = [sample["text"] for sample in train_data if sample["label"] == 1]
            negative_pool = [sample["text"] for sample in train_data if sample["label"] == 0]

            positives = []
            negatives = []

            tokenizer = self.watsonx_model._get_tokenizer()

            max_tokens = max([len(tokenizer.tokenize(item["text"])) for item in train_data])
            max_tokens_in_test = 3 * max_tokens

            num_tokens_in_prompt = 0

            while train_data_index < max(len(positive_pool), len(negative_pool)) and max(len(positives), len(negatives)) < self.watsonx_model.NUM_SHOTS:
                positive_example_len = len(tokenizer.tokenize(positive_pool[train_data_index])) if train_data_index < len(positive_pool) else 0
                negative_example_len = len(tokenizer.tokenize(negative_pool[train_data_index])) if train_data_index < len(negative_pool) else 0
                remaining_tokens = self.watsonx_model._get_max_seq_length() - (num_tokens_in_prompt + sum(
                    [positive_example_len, negative_example_len]) + 30)  # 30 is estimation for instruction and labels
                if remaining_tokens > max_tokens_in_test:
                    num_tokens_in_prompt += sum([positive_example_len, negative_example_len])
                    if train_data_index < len(positive_pool):
                        positives.append(positive_pool[train_data_index])
                    if train_data_index < len(negative_pool):
                        negatives.append(negative_pool[train_data_index])
                train_data_index += 1
        else:
            positives = []
            negatives = []

        model_dir = self.watsonx_model.get_model_dir_by_id(model_id)
        train_path = os.path.join(model_dir, "train_data.json")

        if self.watsonx_model.is_multiclass:
            category_name = [x["category_name"] for x in model_params['category_id_to_info'].values()]
        else:
            category_name = list(model_params['category_id_to_info'].values())[0]["category_name"]
        labeled_texts = {"pos": positives, "neg": negatives}
        available_tokens = self.watsonx_model._get_number_of_available_tokens(category_name, labeled_texts)
        category_name_to_id = {y["category_name"]: x for x, y in model_params['category_id_to_info'].items()}
        with open(train_path, "w") as train_file:
            train_file.write(json.dumps({"positive_labels": positives,
                                         "negative_labels": negatives,
                                         "available_tokens": available_tokens,
                                         'category_name_to_id': category_name_to_id}
                                        ))

        # generate curl for model download
        prompt_for_curl = self.watsonx_model.build_prompt(["<Replace with your text>"], category_name,
                                                          labeled_texts)[0]
        escaped_input_text = json.dumps(prompt_for_curl).replace("'", "'\\''")
        curl = self.watsonx_model._get_curl(escaped_input_text)

        with open(os.path.join(model_dir, "curl.txt"), "w") as text_file:
            text_file.write(curl)



class PromptTuningWithMPT(PromptTuningAPI):

    def __init__(self, watsonx_model):
        super(PromptTuningWithMPT, self).__init__(watsonx_model)

    def train(self, model_id: str, train_data: Sequence[Mapping], model_params: Mapping):
        if self.watsonx_model.is_multiclass:
            category_names = [x["category_name"] for x in model_params['category_id_to_info'].values()]
            verbalizer = Multiclass_Verbalizer.get_instruction(self.watsonx_model._get_tokenizer(), self.watsonx_model.train_seq_len, category_names)
            labels = [model_params['category_id_to_info'].get(ex['label'])["category_name"] for ex in train_data]
            categories_str_for_model_name =  str({", ".join(category_names)})
        else:
            category_name = list(model_params['category_id_to_info'].values())[0]["category_name"]
            pos_label = category_name
            neg_label = f'not {category_name}'
            verbalizer = 'classify { "' + pos_label + '", "' + neg_label + '" } Input: {{input}} Output:'
            labels = [pos_label if ex['label'] else neg_label for ex in train_data]
            categories_str_for_model_name = category_name

        model_out_dir = self.watsonx_model.get_model_dir_by_id(model_id)
        if len(train_data) > 0:
            # prepare and upload the train data
            tokenizer = self.watsonx_model._get_tokenizer()
            verbalizer_len = len(tokenizer(verbalizer)["input_ids"])
            orig_texts = [ex['text'] for ex in train_data]
            texts = [self.watsonx_model._cut_text(t, self.watsonx_model.train_seq_len - verbalizer_len, tokenizer) for t in orig_texts]
            logging.info(self.watsonx_model._get_cut_stat(orig_texts, texts))

            train_file_id = self.watsonx_model.upload_train_data(texts, labels, model_out_dir)

            # submit multi prompt tuning
            api_key = self.watsonx_model.model.service.key
            URL = self.watsonx_model.model.service.service_url
            headers = {"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}
            data = {
                'name': f'Tune model for {categories_str_for_model_name} on {len(train_data)} examples',
                'model_id': self.watsonx_model.base_model,
                'task_id': 'classification',
                'method_id': "mpt",
                'training_file_ids': [train_file_id],
                'parameters': {
                    'accumulate_steps': self.watsonx_model.accumulate_steps,
                    'batch_size': self.watsonx_model.train_batch_size,
                    'learning_rate': self.watsonx_model.learning_rate,
                    'num_epochs': self.watsonx_model.num_epochs,
                    'verbalizer': verbalizer
                }
            }
            response = requests.post(f'{URL}/tunes', headers=headers, data=json.dumps(data))
            if response.status_code != 200:
                raise ValueError(f'Tune request failed with status {response.status_code}:\n{response.text}')
            tune_id = response.json()["results"]["id"]

            # poll the tune status
            while True:
                headers = {"Authorization": f"Bearer {api_key}"}
                response = requests.get(f'{URL}/tunes/{tune_id}', headers=headers)
                if response.status_code != 200:
                    raise ValueError(f'Poll request failed with status {response.status_code}:\n{response.text}')
                tune_status = response.json()["results"]["status"]
                if tune_status == 'COMPLETED':
                    break
                elif tune_status == 'RUNNING':
                    time.sleep(2)
                elif tune_status not in ['INITIALIZING', 'PENDING']:
                    raise ValueError(f'Unexpected tune status: {tune_status}\n{response.text}')
        else:
            tune_id = self.watsonx_model.base_model
        # save the tune result
        category_name_to_id = {y["category_name"]: x for x, y in model_params['category_id_to_info'].items()}
        with open(os.path.join(model_out_dir, 'tune_res.json'), 'w') as f:
            json.dump({'category': category_names, 'tune_id': tune_id, 'category_name_to_id': category_name_to_id}, f)


few_shots_types = {"prompt_engineering" : PromptEngineering, "prompt_tuning_with_mpt" : PromptTuningWithMPT}




# WatsonX model

class WatsonXBaseModel(ModelAPI, ABC):
    def __init__(self, output_dir, background_jobs_manager, gpu_support,
                 prompt_type: PromptType, watsonx_model_type: ModelType, few_shots_type: str, ):
        super(WatsonXBaseModel, self).__init__(output_dir, background_jobs_manager, gpu_support, is_multiclass=prompt_type == PromptType.MULTICLASS)
        load_dotenv()
        self.MAX_RETRIES = 3
        self.NUM_SHOTS = 20
        self.MAX_NEW_TOKENS = 1
        self.WATSON_X_MAX_WORKERS = 3
        self.platform_model_type = watsonx_model_type
        self.str_model_name = bam_model_type_to_str_model_name[watsonx_model_type]
        self.prompt_type = prompt_type
        self.few_shots_type = few_shots_types[few_shots_type](self)
        if watsonx_model_type not in watsonx_model_type_to_max_seq_length:
            raise Exception(f"could not find max sequence length for watsonx model type {watsonx_model_type}")
        else:
            self.max_seq_length = watsonx_model_type_to_max_seq_length[watsonx_model_type]



    def _test_inference_on_startup(self):
        try:
            logging.info(f"testing inference on startup")
            response = list(self._generate(["working?"],watsonx_max_workers=1))[0]
            if response is None:
                raise Exception(f"empty response from self._generate")
        except:
            logging.exception(f"Could not initiate {WatsonXModelComponents.__name__} instance")
            raise

    @staticmethod
    def _cash_api_name_to_endpoint(name_or_url):
        if name_or_url in cash_api_name_to_endpoint:
            return cash_api_name_to_endpoint[name_or_url]

        return name_or_url

    def get_pos_label(self, category_name=None):
        if self.prompt_type == PromptType.YES_NO:
            return "yes"
        elif self.prompt_type == PromptType.CLS_NO_CLS:
            return category_name
        raise Exception(f"{self.prompt_type} not supported")

    def get_neg_label(self, category_name=None):
        if self.prompt_type == PromptType.YES_NO:
            return "no"
        elif self.prompt_type == PromptType.CLS_NO_CLS:
            return "not " + category_name
        raise Exception(f"{self.prompt_type} not supported")

    def get_all_possible_labels(self, category_name):
        if self.prompt_type == PromptType.MULTICLASS:
            return category_name
        return [self.get_pos_label(category_name), self.get_neg_label(category_name)]

    def get_category_prompt(self):
        if self.prompt_type == PromptType.YES_NO:
            return "answer"
        elif self.prompt_type == PromptType.CLS_NO_CLS:
            return "Classification"
        elif self.prompt_type == PromptType.MULTICLASS:
            return "Classification"
        raise Exception(f"{self.prompt_type} not supported")

    def get_instruction(self, category_name):
        if self.prompt_type == PromptType.MULTICLASS:
            return Multiclass_Verbalizer.get_instruction(self._get_tokenizer(), self.train_seq_len, category_name)
        elif self.prompt_type == PromptType.YES_NO:
            return f"Classify if the following text belongs to the category {category_name}." \
                       f" Answer {self.get_pos_label()} or {self.get_neg_label()}."
        elif self.prompt_type == PromptType.CLS_NO_CLS:
            return f"Classify this text as {self.get_pos_label(category_name)} or {self.get_neg_label(category_name)}."
        raise Exception(f"{self.prompt_type} not supported")

    def _get_model_lock_object(self, model_id):
        return super()._get_model_lock_object(model_id)

    def _get_tokenizer(self):

        """ GENAI Current model types
            CODEGEN_MONO_16B = "salesforce/codegen-16b-mono"
            DIAL_FLAN_T5 = "prakharz/dial-flant5-xl"
            DIAL_FLAN_T5 = "prakharz/dial-flant5-xl"
            DIAL_FLAN_T5_3B = "prakharz/dial-flant5-xl"
            FLAN_T5 = "google/flan-t5-xxl"
            FLAN_T5_11B = "google/flan-t5-xxl"
            FLAN_T5_3B = "google/flan-t5-xl"
            FLAN_UL2 = "google/flan-ul2"
            FLAN_UL2_20B = "google/flan-ul2"
            GPT_JT_6B_V1 = "togethercomputer/gpt-jt-6b-v1"
            GPT_NEOX_20B = "eleutherai/gpt-neox-20b"
            MT0 = "bigscience/mt0-xxl"
            MT0_13B = "bigscience/mt0-xxl"
            UL2 = "google/ul2"
            UL2_20B = "google/ul2"
        """

        # current names that are spelled differently
        genai_model_type_to_huggingface = {
            "salesforce/codegen-16b-mono": "Salesforce/codegen-16B-mono",
            "prakharz/dial-flant5-xl": "prakharz/DIAL-FLANT5-XL",
            "togethercomputer/gpt-jt-6b-v1": "togethercomputer/GPT-JT-6B-v1",
            "eleutherai/gpt-neox-20b/gpt-jt-6b-v1": "EleutherAI/gpt-neox-20b",
        }
        model_name = self.platform_model_type.value
        name = genai_model_type_to_huggingface.get(model_name, model_name)
        return AutoTokenizer.from_pretrained(name, model_max_length=self._get_max_seq_length())

    def _train(self, model_id: str, train_data: Sequence[Mapping], model_params: Mapping):
        return self.few_shots_type.train(model_id, train_data, model_params)

    @abstractmethod
    def _get_curl(self, escaped_input_text):
        raise NotImplementedError


    def load_model(self, model_path: str):
        train_path = os.path.join(model_path, "train_data.json")
        metadata = ModelAPI.get_metadata(model_path)
        #TODO Lena: wrap this with a method
        if self.is_multiclass:
            category_name = [x["category_name"] for x in metadata['category_id_to_info'].values()]
        else:
            category_name = list(metadata["category_id_to_info"].values())[0]["category_name"]

        import time
        time.sleep(1)

        with open(train_path, 'r') as train_file:
            train_data = json.load(train_file)
        if self.is_multiclass:
            return WatsonXMultiClassModelComponent(category_name,
            train_data["positive_labels"],
            train_data["negative_labels"],
            train_data["available_tokens"],
              train_data["category_name_to_id"])

        else:
            return WatsonXModelComponents(category_name, train_data["positive_labels"], train_data["negative_labels"],
                                          train_data["available_tokens"])

    def _get_prediction_class(self):
        return super().get_prediction_class()

    def _get_number_of_available_tokens(self, category, labeled_texts):
        tokenizer = self._get_tokenizer()
        empty_texts = ['']
        prompt = self.build_prompt(empty_texts,
                                   category,
                                   labeled_texts)[0]

        number_of_tokens_in_prompt = len(tokenizer(prompt)['input_ids'])

        return self._get_max_seq_length() - number_of_tokens_in_prompt

    def infer(self, model_components, items_to_infer) -> Sequence[Prediction]:
        return self.infer_with_category_and_few_shot(model_components.category_name,
                                                     {"pos": model_components.positive_texts, "neg": model_components.negative_texts},
                                                     items_to_infer)

    def infer_with_category_and_few_shot(self, category, labeled_texts, items_to_infer):
        tokenizer = self._get_tokenizer()
        max_seq_length = self._get_max_seq_length()
        empty_prompt = self.build_prompt([""], category, labeled_texts)[0]
        empty_prompt_token_len = len(tokenizer(empty_prompt)["input_ids"])
        texts = [e['text'] for e in items_to_infer]
        texts_after_cut = [self._cut_text(t, max_seq_length - empty_prompt_token_len, tokenizer) for t in texts]
        logging.info(self._get_cut_stat(texts, texts_after_cut))
        prompts = self.build_prompt(texts_after_cut, category, labeled_texts)
        predictions = [None] * len(prompts)
        num_errors = 0
        indices_to_retry = list(range(len(prompts)))
        try_num = 0
        items_to_infer_original = items_to_infer.copy()
        prompts_original = prompts.copy()
        max_workers = self.WATSON_X_MAX_WORKERS
        while len(indices_to_retry) > 0:
            if try_num == 0:
                logging.info(f"{self.API_ENDPOINT} inferring {len(indices_to_retry)} elements")
            else:
                max_workers = max(int(max_workers / 2), 1)
                logging.info(f"{self.API_ENDPOINT} try #{try_num + 1} to infer the missing {len(indices_to_retry)} elements. Reducing max_workers to {max_workers}")

            predictions, indices_to_retry = self.infer_prompts(indices_to_retry, items_to_infer, category,
                                                               predictions, prompts, watsonx_max_workers=max_workers)
            items_to_infer = list(map(items_to_infer_original.__getitem__, indices_to_retry))
            prompts = list(map(prompts_original.__getitem__, indices_to_retry))
            try_num += 1
            if try_num == self.MAX_RETRIES:
                raise Exception(f"Failed to run inference for after {self.MAX_RETRIES} tries.")

        if num_errors > 0:
            logging.error(f"Total {num_errors} errors out of {len(items_to_infer)}")
        return predictions

    @abstractmethod
    def build_prompt(self, texts, category_name, labeled_texts):
        raise NotImplementedError

    @abstractmethod
    def _process_infer_response(self, response):
        raise NotImplementedError

    @abstractmethod
    def extract_predictions(self, response, category_name):
        raise NotImplementedError

    def infer_prompts(self, indices, items_to_infer, category_name, predictions, prompts, watsonx_max_workers):
        indices_to_retry = []
        num_not_in_format = 0
        for seq_id, (i, response, input) in enumerate(zip(indices, self._generate(prompts, watsonx_max_workers),
                                                          items_to_infer)):
            if response is None:
                indices_to_retry.append(i)
                logging.error(f"None response for {input}")
            else:
                response = self._process_infer_response(response)
                predictions[i] = self.extract_predictions(response, category_name)
                if response.generated_text.lower().strip() not in self.get_all_possible_labels(category_name):
                    logging.warning(f"generated text is {response.generated_text.lower().strip()}, not in the format of the expected output")
                    num_not_in_format += 1
                if self.is_multiclass:
                    logging.debug(
                        f"TEXT:{items_to_infer[seq_id]['text']}\nPROMPT:{prompts[seq_id]}\nRESPONSE:{response.generated_text} ({max(predictions[i].scores)})")
                else:
                    logging.debug(
                        f"TEXT:{items_to_infer[seq_id]['text']}\nPROMPT:{prompts[seq_id]}\nRESPONSE:{response.generated_text} ({predictions[i].score})")
                logging.debug("_________________________________________________________________________")
        if not self.is_multiclass:
            logging.info(f"{num_not_in_format} out of {len(indices)} were not in {self.get_pos_label(category_name)}/{self.get_neg_label(category_name)} format")
        return predictions, indices_to_retry

    def get_supported_languages(self) -> Set[Language]:
        return {Languages.ENGLISH}

    def _cut_text(self, text: str, max_available_tokens, tokenizer):

        tkns = tokenizer(text)
        if len(tkns['input_ids']) > max_available_tokens:
            last_fitting_token_span = tkns[0].token_to_chars(
                max_available_tokens - 1 - 1)  # span of the last fitting token, not including the end of input
            end_of_last_fitting_token = last_fitting_token_span[1]
            new_text = text[0:end_of_last_fitting_token]  # end of the last fitting token

            if not text.startswith(new_text):
                for i in range(len(new_text)):
                    if new_text[i] != text[i]:
                        logging.warning(f"Problem {i}, {new_text[0:i + 1]}, {text[0:i + 1]},")
                        break
            text = new_text
            if len(tokenizer(text)['input_ids']) != max_available_tokens:
                logging.warning(f"Got  {len(tokenizer(text)['input_ids'])} tokens instead of {max_available_tokens}")
        return text

    def _get_cut_stat(self, original_texts, cut_texts):
        result = {'number_of_cut_texts': 0, 'number_of_broken_prefixes': 0, 'longest_cut_text': ''}
        for o, c in zip(original_texts, cut_texts):
            if o == c:
                continue
            result['number_of_cut_texts'] += 1
            if not o.startswith(c):
                result['number_of_broken_prefixes'] += 1
            cut = o[len(c):]
            if len(cut) > len(result['longest_cut_text']):
                result['longest_cut_text'] = cut

        return result

    def _get_max_seq_length(self):
        return self.max_seq_length

class WatsonXModel(WatsonXBaseModel):
    def __init__(self, output_dir, background_jobs_manager, gpu_support, prompt_type: PromptType, watsonx_model_type: ModelType,
                 few_shots_type: str):
        super(WatsonXModel, self).__init__(output_dir, background_jobs_manager, gpu_support, prompt_type,
                                           watsonx_model_type, few_shots_type)
        if watsonx_model_type not in bam_model_type_to_watsonx_model_type.keys():
            raise Exception(f"Model {watsonx_model_type} is not supported by watsonx")

        self.API_ENDPOINT = self._cash_api_name_to_endpoint(os.getenv("GENAI_API", "https://us-south.ml.cloud.ibm.com"))
        logging.info(f"using {self.API_ENDPOINT} for watsonx.ai models using the provided api key")

        api_key = os.getenv("GENAI_KEY")
        self.is_bam = False # TODO: remove this later

        self.platform_model_type = bam_model_type_to_watsonx_model_type[watsonx_model_type]
        project_id = os.getenv("PROJECT_ID")
        if project_id is None:
            raise Exception("watsonx API was provided without providing project id in the 'PROJECT_ID' environment variable")
        GenParams().get_example_values()

        generate_params = {GenParams.MAX_NEW_TOKENS: self.MAX_NEW_TOKENS, GenParams.RETURN_OPTIONS:{
            "token_logprobs": True,
            "generated_tokens": True}
                           }

        self.model = wxModel(
            model_id=self.platform_model_type,
            params=generate_params,
            credentials={
                "apikey": api_key,
                "url": self.API_ENDPOINT
            },
            project_id=project_id
        )
        self._test_inference_on_startup()

    def _generate(self, prompts, watsonx_max_workers):
        start_time = time.time()
        with ThreadPoolExecutor(max_workers=watsonx_max_workers) as executor:
            futures = [executor.submit(self.model.generate, prompt) for prompt in prompts]

        results = []
        for future in futures:
            errors = 0
            try:
                results.append(future.result(7200))
            except:
                logging.exception(f"Failed to get watsonx prediction. Will try again")
                results.append(None)
                errors += 1
        logging.info(f"Finished running inference using watsonx.ai. {len(prompts)} prompts in {time.time()-start_time} seconds")
        return results

    def _get_curl(self, escaped_input_text):
        return f'curl "{self.API_ENDPOINT}/ml/v1-beta/generation/text?version=2022-08-01" \\\n' \
                   '  -H \'Content-Type: application/json\' \\\n' \
                   ' -H \'Accept: application/json\' \\\n' \
                   '  -H \'Authorization: Bearer YOUR_ACCESS_TOKEN\' \\\n' \
                   '  -d \'{\n' \
                   f'  "model_id": "{self.str_model_name}",\n' \
                   '  "input": ' \
                   f'    {escaped_input_text},\n' \
                   '  "parameters": {\n' \
                   '    "decoding_method": "greedy",\n' \
                   '    "min_new_tokens": 1,\n' \
                   f'    "max_new_tokens": {self.MAX_NEW_TOKENS},\n' \
                   '    "beam_width": 1\n' \
                   '  }\n' \
                   f', "project_id": "{os.getenv("PROJECT_ID")}" ' \
                   '}\''

    def _process_infer_response(self, response):
        return GenerateResponse(**response).results[0]

    def extract_predictions(self, response, category_name):
        score = float(numpy.prod(numpy.exp([x.logprob for x in response.generated_tokens])))
        return (Prediction(True, score) if response.generated_text.lower().strip() == self.get_pos_label(
            category_name) else Prediction(
            False, 1 - score))


class InternalBamModel(WatsonXBaseModel):
    def __init__(self, output_dir, background_jobs_manager, gpu_support, prompt_type : PromptType, watsonx_model_type: ModelType,
                 few_shots_type: str, ):
        super(InternalBamModel, self).__init__(output_dir, background_jobs_manager, gpu_support, prompt_type,
                                               watsonx_model_type, few_shots_type)
        self.API_ENDPOINT = "https://bam-api.res.ibm.com/v1" #self._cash_api_name_to_endpoint(os.getenv("GENAI_API", "https://us-south.ml.cloud.ibm.com"))
        logging.info(f"using {self.API_ENDPOINT} for watsonx.ai models using the provided api key")

        if not "bam-api" in self.API_ENDPOINT:
            raise ValueError("Chosen model uses BAM, but the api endpoint is not a BAM end point")

        api_key = os.getenv("GENAI_KEY")
        self.is_bam = True #TODO: remove this later
        self.platform_model_type = watsonx_model_type
        creds = Credentials(api_endpoint=self.API_ENDPOINT,
                            api_key=api_key)  # credentials object to access GENAI

        # Instantiate parameters for text generation
        params = GenerateParams(decoding_method="greedy", max_new_tokens=self.MAX_NEW_TOKENS, return_options={
            "token_logprobs": True,
            "generated_tokens": True
        })

        # Instantiate a model proxy object to send your requests
        self.model = Model(self.platform_model_type, params=params, credentials=creds)
        self._test_inference_on_startup()

    def _generate(self, prompts, watsonx_max_workers):
        return self.model.generate_async(prompts, ordered=True)

    def _get_curl(self, escaped_input_text):
        return f'curl {self.API_ENDPOINT}/generate \\\n' \
               '  -H \'Content-Type: application/json\' \\\n' \
               '  -H \'Authorization: Bearer YOUR_API_KEY\' \\\n' \
               '  -d \'{\n' \
               f'  "model_id": "{self.str_model_name}",\n' \
               '  "inputs": [\n' \
               f'    {escaped_input_text}\n' \
               '  ],\n' \
               '  "parameters": {\n' \
               '    "decoding_method": "greedy",\n' \
               '    "min_new_tokens": 1,\n' \
               f'    "max_new_tokens": {self.MAX_NEW_TOKENS},\n' \
               '    "beam_width": 1\n' \
               '  }\n' \
               '}\''

    def _process_infer_response(self, response):
        return response


    def build_prompt(self, texts, category_name, labeled_texts):
        # we don't need to concatenate the instruction here
        return texts

class WatsonXFlanT5XXLFewShots(WatsonXModel, abc.ABC):
    def __init__(self, output_dir, background_jobs_manager, prompt_type: PromptType):
        super(WatsonXFlanT5XXLFewShots, self).__init__(output_dir, background_jobs_manager, gpu_support=False,
                                                       prompt_type=prompt_type,
                                                       watsonx_model_type=ModelType.FLAN_T5_11B,
                                                       few_shots_type="prompt_engineering")

    def build_prompt(self, texts, category_name, labeled_texts):
        positive_texts = labeled_texts["pos"]
        negative_texts = labeled_texts["neg"]

        positives = (
            [f"text: {t}\n{self.get_category_prompt()}: {self.get_pos_label(category_name)}" for t in positive_texts])
        negatives = (
            [f"text: {t}\n{self.get_category_prompt()}: {self.get_neg_label(category_name)}" for t in negative_texts])
        if len(positives) == 0 and len(negatives) > 0:
            combined = negatives
        elif len(negatives) == 0 and len(positives) > 0:
            combined = positives
        else:
            combined = [None] * (2 * min(len(positives), len(negatives)))
            combined[::2] = positives[:min(len(positives), len(negatives))]
            combined[1::2] = negatives[:min(len(positives), len(negatives))]
            if len(positives) > len(negatives):
                combined.extend(positives[len(negatives):])
            if len(negatives) > len(positives):
                combined.extend(negatives[len(positives):])
        few_shot_examples = "\n".join(combined)

        if len(few_shot_examples) > 0:
            prompts = ["\n".join([f"{self.get_instruction(category_name)} ",
                                  f"{few_shot_examples}", f"text: {text}", f"{self.get_category_prompt()}: "])
                       for text in texts]
        else:
            prompts = ["\n".join([f"{self.get_instruction(category_name)} ", f"text: {text}", f"{self.get_category_prompt()}: "])
                       for text in texts]
        return prompts


class WatsonXFlanT5XXLFewShotsBinary(WatsonXFlanT5XXLFewShots):
    def __init__(self, output_dir, background_jobs_manager):
        super(WatsonXFlanT5XXLFewShotsBinary, self).__init__(output_dir, background_jobs_manager, prompt_type=PromptType.YES_NO)

class WatsonXFlanT5XXLZeroShotMulticlass(WatsonXFlanT5XXLFewShots):
    def __init__(self, output_dir, background_jobs_manager):
        super(WatsonXFlanT5XXLZeroShotMulticlass, self).__init__(output_dir, background_jobs_manager, prompt_type=PromptType.MULTICLASS)
        self.train_seq_len = 256

    def build_prompt(self, texts, category_name, labeled_texts):
        prompts = ["\n".join([f"{self.get_instruction(category_name)} ", f"text: {text}", f"{self.get_category_prompt()}: "])
                       for text in texts]
        return prompts

    def infer(self, model_components, items_to_infer) -> Sequence[Prediction]:
        self.category_name_to_id = model_components.category_name_to_id
        return super(WatsonXFlanT5XXLFewShots, self).infer(model_components, items_to_infer)

    def extract_predictions(self, response, category_name):
        score = float(numpy.prod(numpy.exp([x.logprob for x in response.generated_tokens])))
        # default predicted category is 0
        predicted_label = self.category_name_to_id.get(response.generated_text.lower().strip(),0)
        scores = [0]*len(category_name)
        scores[predicted_label] = score
        return MulticlassPrediction(label=predicted_label, scores=scores)




class WatsonXFlanT5XLMPT(InternalBamModel, abc.ABC):
    def __init__(self, output_dir, background_jobs_manager, prompt_type: PromptType):
        super(WatsonXFlanT5XLMPT, self).__init__(output_dir, background_jobs_manager, gpu_support=False, prompt_type=prompt_type,
                                                 watsonx_model_type=ModelType.FLAN_T5_3B,
                                                 few_shots_type="prompt_tuning_with_mpt")
        self.base_model = 'google/flan-t5-xl'
        self.train_seq_len = 256
        self.accumulate_steps = 16
        self.train_batch_size = 16
        self.learning_rate = 0.3
        self.num_epochs = 50

    def load_model(self, model_path: str):
        with open(os.path.join(model_path, 'tune_res.json')) as f:
            tune_res = json.load(f)
        if self.is_multiclass:
            tune_res["category"] = tune_res["category"]
        return tune_res

    def upload_train_data(self, inputs, outputs, model_dir):
        res = []
        for inp, outp in zip(inputs, outputs):
            res.append({"input": inp, "output": outp})
        temp_file = os.path.join(model_dir, 'train_data.json')
        with open(temp_file, "w") as f:
            json.dump(res, f)

        headers = {'Authorization': f'Bearer {self.model.service.key}'}
        URL = self.model.service.service_url + '/files'
        data = {'purpose': "tune"}
        files = {
            'file': open(temp_file, 'rb'),
        }
        response = requests.post(URL, headers=headers, files=files, data=data)
        if response.status_code != 201:
            raise ValueError(f'Upload train data failed with status {response.status_code}:\n{response.text}')

        file_id = response.json()["results"]["id"]
        os.remove(temp_file)

        return file_id

    def infer(self, model_components, items_to_infer) -> Sequence[Prediction]:
        category = model_components['category']
        tune_id = model_components['tune_id']
        self.model.model = tune_id
        return self.infer_with_category_and_few_shot(category, {"pos": [], "neg": []}, items_to_infer)



class WatsonXFlanT5XLMPTBinary(WatsonXFlanT5XLMPT):
    def __init__(self, output_dir, background_jobs_manager):
        super(WatsonXFlanT5XLMPTBinary, self).__init__(output_dir, background_jobs_manager, prompt_type=PromptType.CLS_NO_CLS)

    def extract_predictions(self, response, category_name):
        score = float(numpy.prod(numpy.exp([x.logprob for x in response.generated_tokens])))
        return (Prediction(True, score) if response.generated_text.lower().strip() == self.get_pos_label(
            category_name) else Prediction(
            False, 1 - score))


class WatsonXFlanT5XLMPTMC(WatsonXFlanT5XLMPT):
    def __init__(self, output_dir, background_jobs_manager):
        super(WatsonXFlanT5XLMPTMC, self).__init__(output_dir, background_jobs_manager, PromptType.MULTICLASS)

    def infer(self, model_components, items_to_infer) -> Sequence[Prediction]:
        self.category_name_to_id = model_components["category_name_to_id"]
        return super(WatsonXFlanT5XLMPTMC, self).infer(model_components, items_to_infer)

    def extract_predictions(self, response, category_name):
        score = float(numpy.prod(numpy.exp([x.logprob for x in response.generated_tokens])))
        # default predicted category is 0
        predicted_label = self.category_name_to_id.get(response.generated_text.lower().strip(),0)
        scores = [0]*len(category_name)
        scores[predicted_label] = score
        return MulticlassPrediction(label=predicted_label, scores=scores)


class JointModel(ModelAPI):
    def __init__(self, output_dir, background_jobs_manager):
        self.mpt_mc_model = WatsonXFlanT5XLMPTMC(output_dir, background_jobs_manager)
        self.zero_shot_mc_model = WatsonXFlanT5XXLZeroShotMulticlass(output_dir, background_jobs_manager)
        self.curr_model = self.zero_shot_mc_model

    def _train(self, model_id: str, train_data: Sequence[Mapping], model_params: Mapping):
        return self.curr_model._train(model_id, train_data, model_params)

    def train(self, model_id: str, train_data: Sequence[Mapping], model_params: Mapping):
        return self.curr_model.train(model_id, train_data, model_params)

    def load_model(self, model_path: str):
        return self.curr_model.load_model(model_path)

    def infer(self, model_components, items_to_infer) -> Sequence[Union[Prediction, MulticlassPrediction]]:
        return self.curr_model.infer(model_components, items_to_infer)

    def get_supported_languages(self) -> Set[Language]:
        return self.curr_model.get_supported_languages()

    def get_models_dir(self):
        return self.curr_model.get_models_dir()

def main_few_shots():
    api = WatsonXFlanT5XXLFewShotsBinary("/tmp", BackgroundJobsManager())
    train_data = [
        {"text": "If you choose to decline cookies, some parts of the Airbnb Platform may not work as intended or may not work at all.", "label":1},
         {"text": "As a condition to using Services, you are required to open an account with 500px and select a password and username, and to provide registration information.The registration information you provide must be accurate, complete, and current at all times.", "label": 0},
         {"text": "§ You must opt-out separately from each computer or device and browser that you use to access our Sites and if you clear your cookies, you will need to repeat the opt-out process.", "label": 1},
         {"text": "Please note that if you request the erasure of your personal information: We may retain some of your personal information as necessary for our legitimate business interests, such as fraud detection and prevention and enhancing safety.For example, if we suspend an Airbnb Account for fraud or safety reasons, we may retain certain information from that Airbnb Account to prevent that Member from opening a new Airbnb Account in the future.We may retain and use your personal information to the extent necessary to comply with our legal obligations.For example, Airbnb and Airbnb Payments may keep some of your information for tax, legal reporting and auditing obligations.<", "label": 0},
         {"text": "Additionally, Microsoft partners with third-party ad companies to help provide some of our advertising services, and we also allow other third-party ad companies to display advertisements on our sites.These third parties may place cookies on your computer and collect data about your online activities across websites or online services.", "label": 1},
         {"text": "By posting Visual Content to the Site, you grant to 500px a non-exclusive or exclusive, transferable, fully paid, worldwide license to use, sublicense, distribute, reproduce, modify, adapt, publicly perform and publicly display such Visual Content in connection with the Services.This license will exist for the period during which the Visual Content is posted on the Site and will automatically terminate upon the removal of the Visual Content from the Site, subject to the terms of any license granted by an authorized 500px distributor;The license granted to 500px includes the right to use Visual Content fully or partially for promotional reasons and to distribute and redistribute Visual Content to other parties, websites, authorized agents, applications, and other entities, provided such Visual Content is attributed in accordance with the required credits (i.e.username or collection name, profile picture, photo title, descriptions, tags, and other accompanying information) if any and as appropriate, as submitted to 500px, subject to any credit requirements governing the licensing of Visual Content pursuant to the Contributor Agreement (notwithstanding the foregoing, no inadvertent failure to provide appropriate attribution shall be considered a breach of these Terms);500px and its distributors have the right to modify, alter and amend photo titles, descriptions, tags, metadata and other accompanying information for any Visual Content and the right to submit Visual Content to other parties and authorized agents for the purpose of creating tags for Visual Content;", "label": 0},
         {"text": "Other Data Partners use cookies and other tracking technologies to enable the delivery of interest-based advertising to users.", "label": 1},
         {"text": "500px reserves the right, at its sole discretion, to modify or replace the Terms at any time.If the alterations constitute a material change to the Terms, 500px will notify you by posting an announcement on the Site.What constitutes a material change will be determined at 500px’s sole discretion.You are responsible for reviewing and becoming familiar with any such modifications.Using any Service or viewing any Visual Content constitutes your acceptance of the Terms as modified.", "label": 0},
         {"text": "Third-parties who provide us with products and services may also place cookies, ad tags and/or beacons that collect the information outlined above in order to provide us with products and services including: Analytics tools (e. g. , Google Analytics) allowing us to analyze the performance of our Services.", "label": 1},
         {"text": "It also enables us to serve you advertising and other relevant content on and off of the Academia.edu Services.", "label": 0},
         {"text": "Information about our use of cookies and how you can change your cookie settings can be found here.", "label": 1},
         {"text": "If Airbnb undertakes or is involved in any merger, acquisition, reorganization, sale of assets, bankruptcy, or insolvency event, then we may sell, transfer or share some or all of our assets, including your information", "label": 0},
         {"text": "We use cookies and other similar technologies, such as web beacons, pixels, and mobile identifiers.", "label": 1},
            {"text": "a binding arbitration administered by the American Arbitration Association (“AAA”)", "label": 0},
         {"text": "We may also use third party cookies for the purposes of web analytics, attribution and error management.", "label": 1},
         {"text": "YOU AND 500PX AGREE THAT ANY PROCEEDINGS TO RESOLVE OR LITIGATE ANY DISPUTE ARISING HEREUNDER WILL BE CONDUCTED SOLELY ON AN INDIVIDUAL BASIS, AND THAT YOU WILL NOT SEEK TO HAVE ANY DISPUTE HEARD AS A CLASS ACTION, A REPRESENTATIVE ACTION, A COLLECTIVE ACTION, A PRIVATE ATTORNEY-GENERAL ACTION, OR IN ANY PROCEEDING IN WHICH YOU ACT OR PROPOSE TO ACT IN A REPRESENTATIVE CAPACITY.YOU FURTHER AGREE THAT NO PROCEEDING WILL BE JOINED, CONSOLIDATED, OR COMBINED WITH ANOTHER PROCEEDING WITHOUT THE PRIOR WRITTEN CONSENT OF 500PX AND ALL PARTIES TO ANY SUCH PROCEEDING.", "label": 0},
        ]
    classes = {"category_id_to_info": {0: {"category_name": "cookies"}}}
    num_of_rate_limit_test_sentence = 1
    input_texts = [
        # 'Like many websites, we use "cookies" and "web beacons" to collect information.',
        #          "Access to web search results or other general content on our Sites does not require you to provide us any personal (e. g. , name, date of birth), contact (e. g. , email address, phone number) and/or account (username and password) information.",
        #         "You will continue to see advertisements on our Sites.",
        "This cookies policy was last updated on [1] June 2018 and is reviewed every 12 months.",
        "Get In Touch Chat with Sales Akamai will record this transcript.",
        "These Data Partners will provide us with additional information about you (such as your interests, preferences or demographic information)."
    ] + [f"Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit  {x}" for x in range(num_of_rate_limit_test_sentence)]
    run_main(api, train_data, classes, input_texts)

def main_zero_shot_binary():
    api = WatsonXFlanT5XXLFewShotsBinary("/tmp", BackgroundJobsManager())
    train_data = [
        ]
    classes = {"category_id_to_info": {0: {"category_name": "cookies"}}}
    num_of_rate_limit_test_sentence = 1
    input_texts = [
        # 'Like many websites, we use "cookies" and "web beacons" to collect information.',
        #          "Access to web search results or other general content on our Sites does not require you to provide us any personal (e. g. , name, date of birth), contact (e. g. , email address, phone number) and/or account (username and password) information.",
        #         "You will continue to see advertisements on our Sites.",
        "This cookies policy was last updated on [1] June 2018 and is reviewed every 12 months.",
        "Get In Touch Chat with Sales Akamai will record this transcript.",
        "These Data Partners will provide us with additional information about you (such as your interests, preferences or demographic information)."
    ] + [f"Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit Testing rate limit  {x}" for x in range(num_of_rate_limit_test_sentence)]
    run_main(api, train_data, classes, input_texts)


def main_zero_shot_multiclass_bam():
    api = WatsonXFlanT5XLMPTMC("/tmp", BackgroundJobsManager())
    train_data = [
        ]
    classes = {"category_id_to_info": {0: {"category_name": "cookies"}, 1: {"category_name": "cars"}, 2: {"category_name": "finance"}}}
    input_texts = [
        # 'Like many websites, we use "cookies" and "web beacons" to collect information.',
        #          "Access to web search results or other general content on our Sites does not require you to provide us any personal (e. g. , name, date of birth), contact (e. g. , email address, phone number) and/or account (username and password) information.",
        #         "You will continue to see advertisements on our Sites.",
        "This cookies policy was last updated on [1] June 2018 and is reviewed every 12 months.",
        "Get In Touch Chat with Sales Akamai will record this transcript.",
        "These Data Partners will provide us with additional information about you (such as your interests, preferences or demographic information).",
        "If you choose to decline cookies, some parts of the Airbnb Platform may not work as intended or may not work at all."
    ]
    run_main(api, train_data, classes, input_texts)



def main_mpt():
    api = WatsonXFlanT5XLMPTBinary("/tmp", BackgroundJobsManager())
    train_data = [
            {
                "text": "If you choose to decline cookies, some parts of the Airbnb Platform may not work as intended or may not work at all.",
                "label": 1},
            {
                "text": "As a condition to using Services, you are required to open an account with 500px and select a password and username, and to provide registration information.The registration information you provide must be accurate, complete, and current at all times.",
                "label": 0},
        ]
    classes = {"category_id_to_info": {0: {"category_name": "cookies"}}}

    input_texts = [
        # 'Like many websites, we use "cookies" and "web beacons" to collect information.',
        #          "Access to web search results or other general content on our Sites does not require you to provide us any personal (e. g. , name, date of birth), contact (e. g. , email address, phone number) and/or account (username and password) information.",
        #         "You will continue to see advertisements on our Sites.",
        "This cookies policy was last updated on [1] June 2018 and is reviewed every 12 months.",
        "Get In Touch Chat with Sales Akamai will record this transcript.",
        "These Data Partners will provide us with additional information about you (such as your interests, preferences or demographic information).",
        "If you choose to decline cookies, some parts of the Airbnb Platform may not work as intended or may not work at all."
    ]
    run_main(api, train_data, classes, input_texts)




def main_mpt_mc():
    api = WatsonXFlanT5XLMPTMC("/tmp", BackgroundJobsManager())
    train_data =  [               {
                    "text": "If you choose to decline cookies, some parts of the Airbnb Platform may not work as intended or may not work at all.",
                    "label": 2},
                {
                    "text": "As a condition to using Services, you are required to open an account with 500px and select a password and username, and to provide registration information.The registration information you provide must be accurate, complete, and current at all times.",
                    "label": 0},
                {
                    "text": "§ You must opt-out separately from each computer or device and browser that you use to access our Sites and if you clear your cookies, you will need to repeat the opt-out process.",
                    "label": 1},
                {
                    "text": "Please note that if you request the erasure of your personal information: We may retain some of your personal information as necessary for our legitimate business interests, such as fraud detection and prevention and enhancing safety.For example, if we suspend an Airbnb Account for fraud or safety reasons, we may retain certain information from that Airbnb Account to prevent that Member from opening a new Airbnb Account in the future.We may retain and use your personal information to the extent necessary to comply with our legal obligations.For example, Airbnb and Airbnb Payments may keep some of your information for tax, legal reporting and auditing obligations.<",
                    "label": 0},
                {
                    "text": "Additionally, Microsoft partners with third-party ad companies to help provide some of our advertising services, and we also allow other third-party ad companies to display advertisements on our sites.These third parties may place cookies on your computer and collect data about your online activities across websites or online services.",
                    "label": 1},
                {
                    "text": "By posting Visual Content to the Site, you grant to 500px a non-exclusive or exclusive, transferable, fully paid, worldwide license to use, sublicense, distribute, reproduce, modify, adapt, publicly perform and publicly display such Visual Content in connection with the Services.This license will exist for the period during which the Visual Content is posted on the Site and will automatically terminate upon the removal of the Visual Content from the Site, subject to the terms of any license granted by an authorized 500px distributor;The license granted to 500px includes the right to use Visual Content fully or partially for promotional reasons and to distribute and redistribute Visual Content to other parties, websites, authorized agents, applications, and other entities, provided such Visual Content is attributed in accordance with the required credits (i.e.username or collection name, profile picture, photo title, descriptions, tags, and other accompanying information) if any and as appropriate, as submitted to 500px, subject to any credit requirements governing the licensing of Visual Content pursuant to the Contributor Agreement (notwithstanding the foregoing, no inadvertent failure to provide appropriate attribution shall be considered a breach of these Terms);500px and its distributors have the right to modify, alter and amend photo titles, descriptions, tags, metadata and other accompanying information for any Visual Content and the right to submit Visual Content to other parties and authorized agents for the purpose of creating tags for Visual Content;",
                    "label": 0},
                {
                    "text": "Other Data Partners use cookies and other tracking technologies to enable the delivery of interest-based advertising to users.",
                    "label": 1},
                {
                    "text": "500px reserves the right, at its sole discretion, to modify or replace the Terms at any time.If the alterations constitute a material change to the Terms, 500px will notify you by posting an announcement on the Site.What constitutes a material change will be determined at 500px’s sole discretion.You are responsible for reviewing and becoming familiar with any such modifications.Using any Service or viewing any Visual Content constitutes your acceptance of the Terms as modified.",
                    "label": 0},
                {
                    "text": "Third-parties who provide us with products and services may also place cookies, ad tags and/or beacons that collect the information outlined above in order to provide us with products and services including: Analytics tools (e. g. , Google Analytics) allowing us to analyze the performance of our Services.",
                    "label": 1},
                {
                    "text": "It also enables us to serve you advertising and other relevant content on and off of the Academia.edu Services.",
                    "label": 0},
                {
                    "text": "Information about our use of cookies and how you can change your cookie settings can be found here.",
                    "label": 1},
                {
                    "text": "If Airbnb undertakes or is involved in any merger, acquisition, reorganization, sale of assets, bankruptcy, or insolvency event, then we may sell, transfer or share some or all of our assets, including your information",
                    "label": 0},
                {
                    "text": "We use cookies and other similar technologies, such as web beacons, pixels, and mobile identifiers.",
                    "label": 1},
                {"text": "a binding arbitration administered by the American Arbitration Association (“AAA”)", "label": 0},
                {
                    "text": "We may also use third party cookies for the purposes of web analytics, attribution and error management.",
                    "label": 1},
                {
                    "text": "YOU AND 500PX AGREE THAT ANY PROCEEDINGS TO RESOLVE OR LITIGATE ANY DISPUTE ARISING HEREUNDER WILL BE CONDUCTED SOLELY ON AN INDIVIDUAL BASIS, AND THAT YOU WILL NOT SEEK TO HAVE ANY DISPUTE HEARD AS A CLASS ACTION, A REPRESENTATIVE ACTION, A COLLECTIVE ACTION, A PRIVATE ATTORNEY-GENERAL ACTION, OR IN ANY PROCEEDING IN WHICH YOU ACT OR PROPOSE TO ACT IN A REPRESENTATIVE CAPACITY.YOU FURTHER AGREE THAT NO PROCEEDING WILL BE JOINED, CONSOLIDATED, OR COMBINED WITH ANOTHER PROCEEDING WITHOUT THE PRIOR WRITTEN CONSENT OF 500PX AND ALL PARTIES TO ANY SUCH PROCEEDING.",
                    "label": 0},

        ]
    classes = {"category_id_to_info": {0: {"category_name": "cookies"}, 1: {"category_name": "cars"}, 2: {"category_name": "finance"}}}
    input_texts = [
        # 'Like many websites, we use "cookies" and "web beacons" to collect information.',
        #          "Access to web search results or other general content on our Sites does not require you to provide us any personal (e. g. , name, date of birth), contact (e. g. , email address, phone number) and/or account (username and password) information.",
        #         "You will continue to see advertisements on our Sites.",
        "This cookies policy was last updated on [1] June 2018 and is reviewed every 12 months.",
        "Get In Touch Chat with Sales Akamai will record this transcript.",
        "These Data Partners will provide us with additional information about you (such as your interests, preferences or demographic information).",
        "If you choose to decline cookies, some parts of the Airbnb Platform may not work as intended or may not work at all."
    ]
    run_main(api, train_data, classes, input_texts)

def run_main(api_obj, train_data, classes, texts_to_infer):
    model_id = api_obj.train(
        train_data, Languages.ENGLISH,
        classes)[0]

    while api_obj.get_model_status(model_id) != ModelStatus.READY:
        import time
        time.sleep(1)
        #logging.info(f"waiting for model id {model_id}")
    preds = api_obj.infer_by_id(model_id, [{"text": text} for text in texts_to_infer], use_cache=False)
    for text, preds in zip(texts_to_infer, preds):
        logging.info(f"{text}\n{preds}")
        logging.info("***")

if __name__ == "__main__":
    #watsonX
    is_bam = True
    is_zero_shot = True
    os.environ["PROJECT_ID"] = ""
    if not is_bam:
        #set watsonX key
        os.environ["GENAI_KEY"] = ""
        main_zero_shot_binary()
    else:
        #set bam key
        os.environ["GENAI_KEY"] = ""
        if is_zero_shot:
            main_zero_shot_multiclass_bam()
        else:
            main_mpt_mc()


