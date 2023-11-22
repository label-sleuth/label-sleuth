# pip install ibm-generative-ai===0.1.15
import abc
import ast
import os
import logging
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, asdict
from abc import ABC, abstractmethod, ABCMeta
from enum import Enum
import difflib
from collections import Counter
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
class WatsonXModelComponent:
    labeled_texts: dict
    available_tokens: int
    is_zero_shot: bool

@dataclass
class WatsonXBinaryModelComponent(WatsonXModelComponent):
    category_name: str

@dataclass
class WatsonXMCModelComponent(WatsonXModelComponent):
    category_name_to_id: dict
    sorted_categories_by_freq: list

@dataclass
class TunableModelComponent:
    tune_id: str

@dataclass
class WatsonXTunableMCModelComponent(WatsonXMCModelComponent, TunableModelComponent):
    class_names_in_verbalizer: bool


@dataclass
class WatsonXTunableBinaryModelComponent(WatsonXBinaryModelComponent, TunableModelComponent):
    pass


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
    def get_instruction(tokenizer, train_seq_len, category_names, sorted_categories_by_freq, is_train=False):
        if sorted_categories_by_freq:
            category_names = [x for x,y in sorted_categories_by_freq]
        else:
            category_names = sorted(category_names)
        class_names_in_verbalizer=True
        tokenizer = tokenizer
        verbalizer = Multiclass_Verbalizer.get_class_names_verbalizer(category_names)
        verbalizer_len = len(tokenizer(verbalizer.replace("{{input}}", ""))["input_ids"])
        #only in case of training we may remove the categories due to lenght limitation
        if verbalizer_len > train_seq_len and is_train:
            logging.info(
                "The verbalizer itself is longer than the permitted token limit. We fallback to the generic verbalizer.")
            verbalizer = Multiclass_Verbalizer.get_no_class_names_verbalizer()
            class_names_in_verbalizer=False
        return verbalizer, class_names_in_verbalizer, category_names

class WatsonXBaseModel(ModelAPI, ABC):
    def __init__(self, output_dir, background_jobs_manager, gpu_support,
                 prompt_type: PromptType, watsonx_model_type: ModelType, api_endpoint:str):
        super(WatsonXBaseModel, self).__init__(output_dir, background_jobs_manager, gpu_support,
                                               is_multiclass=prompt_type == PromptType.MULTICLASS)
        load_dotenv()
        self.MAX_RETRIES = 3
        self.NUM_SHOTS = 20
        self.MAX_NEW_TOKENS = 1
        self.WATSON_X_MAX_WORKERS = 3
        self.platform_model_type = watsonx_model_type
        self.str_model_name = bam_model_type_to_str_model_name[watsonx_model_type]
        self.prompt_type = prompt_type
        self.is_bam=False

        if watsonx_model_type not in watsonx_model_type_to_max_seq_length:
            raise Exception(f"could not find max sequence length for watsonx model type {watsonx_model_type}")
        else:
            self.max_seq_length = watsonx_model_type_to_max_seq_length[watsonx_model_type]


        self.API_ENDPOINT = api_endpoint
        logging.info(f"using {self.API_ENDPOINT} for watsonx.ai models using the provided api key")

        api_key = os.getenv("GENAI_KEY")

        if "bam-api" in self.API_ENDPOINT:
            self.is_bam = True
            self.platform_model_type = watsonx_model_type
            creds = Credentials(api_endpoint=self.API_ENDPOINT,
                                api_key=api_key)  # credentials object to access GENAI

            # Instantiate parameters for text generation
            params = GenerateParams(decoding_method="greedy", max_new_tokens=self.MAX_NEW_TOKENS, return_options={
                "token_logprobs": True,
                "generated_tokens": True
                })

            # Instantiate a model proxy object to send your requests
            self.zero_shot_model = Model(self.platform_model_type, params=params, credentials=creds)

        else: #watsonx https://ibm.github.io/watson-machine-learning-sdk/foundation_models.html
            if watsonx_model_type not in bam_model_type_to_watsonx_model_type.keys():
                raise Exception(f"Bam model {watsonx_model_type} is not supported by watsonx")
            self.platform_model_type = bam_model_type_to_watsonx_model_type[watsonx_model_type]
            self.is_bam = False
            project_id = os.getenv("PROJECT_ID")
            if project_id is None:
                raise Exception("watsonx API was provided without providing project id in the 'PROJECT_ID' environment variable")
            GenParams().get_example_values()

            generate_params = {GenParams.MAX_NEW_TOKENS: self.MAX_NEW_TOKENS, GenParams.RETURN_OPTIONS:{
                "token_logprobs": True,
                "generated_tokens": True}
            }

            self.zero_shot_model = wxModel(
                model_id=self.str_model_name,
                params=generate_params,
                credentials={
                    "apikey": api_key,
                    "url": self.API_ENDPOINT
                },
                project_id=project_id
            )
        try:
            logging.info(f"testing inference on startup")
            response = list(self._generate(["working?"],watsonx_max_workers=1, model=self.zero_shot_model))[0]
            if response is None:
                raise Exception(f"empty response from self._generate")
        except:
            logging.exception(f"Could not initiate {WatsonXBaseModel.__name__} instance")
            raise


    def save_curl_instruction_to_file(self, labeled_texts, model_components, model_dir):
        # generate curl for model download
        prompt_for_curl = self.build_prompt(["<Replace with your text>"],
                                                          labeled_texts, model_components)[0]
        escaped_input_text = json.dumps(prompt_for_curl).replace("'", "'\\''")
        curl = self._get_curl(escaped_input_text, model_components)

        with open(os.path.join(model_dir, "curl.txt"), "w") as text_file:
            text_file.write(curl)


    def _get_curl(self, escaped_input_text, model_components):
        if self.is_bam:
            tune_id = model_components.tune_id
            return f'curl {self.API_ENDPOINT}/generate \\\n' \
                   '  -H \'Content-Type: application/json\' \\\n' \
                   '  -H \'Authorization: Bearer YOUR_API_KEY\' \\\n' \
                   '  -d \'{\n' \
                   f'  "model_id": "{tune_id}",\n' \
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
        else: #watsonx
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

    def extract_predictions(self, response, model_components):
        score = float(numpy.prod(numpy.exp([x.logprob for x in response.generated_tokens])))
        return (Prediction(True, score) if response.generated_text.lower().strip() == self.get_pos_label(
            model_components.category_name) else Prediction(
            False, 1 - score))


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

    def get_all_possible_labels(self, model_component):
        if self.prompt_type == PromptType.MULTICLASS:
            return model_component.category_name_to_id.keys()
        return [self.get_pos_label(model_component.category_name), self.get_neg_label(model_component.category_name)]

    def get_category_prompt(self):
        if self.prompt_type == PromptType.YES_NO:
            return "answer"
        elif self.prompt_type == PromptType.CLS_NO_CLS:
            return "Classification"
        elif self.prompt_type == PromptType.MULTICLASS:
            return "Classification"
        raise Exception(f"{self.prompt_type} not supported")

    def get_instruction(self, model_components):
        if self.prompt_type == PromptType.MULTICLASS:
            return Multiclass_Verbalizer.get_instruction(self._get_tokenizer(), self.train_seq_len,
                                                         category_names=model_components.category_name_to_id.keys(),
                                                         sorted_categories_by_freq=model_components.sorted_categories_by_freq)[0]
        elif self.prompt_type == PromptType.YES_NO:
            return f"Classify if the following text belongs to the category {model_components.category_name}." \
                       f" Answer {self.get_pos_label()} or {self.get_neg_label()}."
        elif self.prompt_type == PromptType.CLS_NO_CLS:
            return f"Classify this text as {self.get_pos_label(model_components.category_name)} or {self.get_neg_label(model_components.category_name)}."
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

    def load_model(self, model_path: str):
        if self.is_bam:
            with open(os.path.join(model_path, 'tune_res.json')) as f:
                tune_res = json.load(f)
            if self.is_multiclass:
                return WatsonXTunableMCModelComponent(**tune_res)
            else:
                return WatsonXTunableBinaryModelComponent(**tune_res)
        else:
            train_path = os.path.join(model_path, "train_data.json")
            metadata = ModelAPI.get_metadata(model_path)
            category_name = [x["category_name"] for x in metadata['category_id_to_info'].values()]
            import time
            time.sleep(1)

            with open(train_path, 'r') as train_file:
                train_data = json.load(train_file)
            return WatsonXBinaryModelComponent(category_name=category_name, labeled_texts=train_data["labeled_texts"],
                                              available_tokens=train_data["available_tokens"], is_zero_shot=train_data["is_zero_shot"])

    def _get_prediction_class(self):
        return super().get_prediction_class()

    def _get_number_of_available_tokens(self, labeled_texts, model_components):
        tokenizer = self._get_tokenizer()
        empty_texts = ['']
        prompt = self.build_prompt(empty_texts,
                                   labeled_texts, model_components)[0]

        number_of_tokens_in_prompt = len(tokenizer(prompt)['input_ids'])

        return self._get_max_seq_length() - number_of_tokens_in_prompt

    def infer_with_category_and_few_shot(self, items_to_infer, model, model_components):
        tokenizer = self._get_tokenizer()
        max_seq_length = self._get_max_seq_length()
        labeled_texts = model_components.labeled_texts
        empty_prompt = self.build_prompt([""], labeled_texts, model_components)[0]
        empty_prompt_token_len = len(tokenizer(empty_prompt)["input_ids"])
        texts = [e['text'] for e in items_to_infer]
        texts_after_cut = [self._cut_text(t, max_seq_length - empty_prompt_token_len, tokenizer) for t in texts]
        logging.info(self._get_cut_stat(texts, texts_after_cut))
        prompts = self.build_prompt(texts_after_cut, labeled_texts, model_components)
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

            predictions, indices_to_retry = self.infer_prompts(indices_to_retry, items_to_infer,
                                                               predictions, prompts, watsonx_max_workers=max_workers, model=model,
                                                               model_components=model_components)
            items_to_infer = list(map(items_to_infer_original.__getitem__, indices_to_retry))
            prompts = list(map(prompts_original.__getitem__, indices_to_retry))
            try_num += 1
            if try_num == self.MAX_RETRIES:
                raise Exception(f"Failed to run inference for after {self.MAX_RETRIES} tries.")

        if num_errors > 0:
            logging.error(f"Total {num_errors} errors out of {len(items_to_infer)}")
        return predictions

    @abstractmethod
    def build_prompt(self, texts, labeled_texts, model_components):
        raise NotImplementedError

    @abstractmethod
    def _train(self, model_id: str, train_data: Sequence[Mapping], model_params: Mapping):
        raise NotImplementedError

    @abstractmethod
    def _process_infer_response(self, response):
        raise NotImplementedError

    @abstractmethod
    def extract_predictions(self, response, category_name):
        raise NotImplementedError

    def infer_prompts(self, indices, items_to_infer, predictions, prompts, watsonx_max_workers, model, model_components):
        indices_to_retry = []
        num_not_in_format = 0
        all_possible_labels = None

        for seq_id, (i, response, input) in enumerate(zip(indices, self._generate(prompts, watsonx_max_workers, model),
                                                          items_to_infer)):
            if response is None:
                indices_to_retry.append(i)
                logging.error(f"None response for {input}")
            else:
                response = self._process_infer_response(response)
                predictions[i] = self.extract_predictions(response, model_components)
                if response.generated_text.lower().strip() not in self.get_all_possible_labels(model_components):
                    logging.debug(f"generated text is {response.generated_text.lower().strip()}, not in the format of the expected output")
                    num_not_in_format += 1
                if self.is_multiclass:
                    logging.debug(
                        f"TEXT:{items_to_infer[seq_id]['text']}\nPROMPT:{prompts[seq_id]}\nRESPONSE:{response.generated_text} ({max(predictions[i].scores)})")
                else:
                    logging.debug(
                        f"TEXT:{items_to_infer[seq_id]['text']}\nPROMPT:{prompts[seq_id]}\nRESPONSE:{response.generated_text} ({predictions[i].score})")
                logging.debug("_________________________________________________________________________")
        if not self.is_multiclass:
            logging.info(f"{num_not_in_format} out of {len(indices)} were not in {self.get_pos_label(model_components.category_name)}/{self.get_neg_label(model_components.category_name)} format")
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

    def _generate(self, prompts, watsonx_max_workers, model):
        if self.is_bam:
            return model.generate_async(prompts, ordered=True)
        else:
            start_time = time.time()
            with ThreadPoolExecutor(max_workers=watsonx_max_workers) as executor:
                futures = [executor.submit(model.generate, prompt) for prompt in prompts]

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

class FewShotsWatsonXModel(WatsonXBaseModel):

    def __init__(self, output_dir, background_jobs_manager, watsonx_model_type, prompt_type: PromptType):
        super(FewShotsWatsonXModel, self).__init__(output_dir, background_jobs_manager, gpu_support=False,
                                                       prompt_type=prompt_type,
                                                       watsonx_model_type=watsonx_model_type,
                                                       api_endpoint=self._cash_api_name_to_endpoint(os.getenv("GENAI_API", "https://us-south.ml.cloud.ibm.com"))
                                                       )

    def infer(self, model_components, items_to_infer) -> Sequence[Prediction]:
        return self.infer_with_category_and_few_shot(items_to_infer, self.zero_shot_model,
                                                     model_components)


    def _process_infer_response(self, response):
        return GenerateResponse(**response).results[0]

class FewShotsWatsonXModelBinary(FewShotsWatsonXModel):
    def __init__(self, output_dir, background_jobs_manager, watsonx_model_type):
        super(FewShotsWatsonXModelBinary, self).__init__(output_dir, background_jobs_manager, watsonx_model_type=watsonx_model_type,
                                                         prompt_type=PromptType.YES_NO)

    def _train(self, model_id: str, train_data: Sequence[Mapping], model_params: Mapping):
        if len(train_data) > 0:
            train_data_index = 0
            positive_pool = [sample["text"] for sample in train_data if sample["label"] == 1]
            negative_pool = [sample["text"] for sample in train_data if sample["label"] == 0]

            positives = []
            negatives = []

            tokenizer = self._get_tokenizer()

            max_tokens = max([len(tokenizer.tokenize(item["text"])) for item in train_data])
            max_tokens_in_test = 3 * max_tokens

            num_tokens_in_prompt = 0

            while train_data_index < max(len(positive_pool), len(negative_pool)) and max(len(positives),
                                                                                         len(negatives)) < self.NUM_SHOTS:
                positive_example_len = len(
                    tokenizer.tokenize(positive_pool[train_data_index])) if train_data_index < len(positive_pool) else 0
                negative_example_len = len(
                    tokenizer.tokenize(negative_pool[train_data_index])) if train_data_index < len(negative_pool) else 0
                remaining_tokens = self._get_max_seq_length() - (num_tokens_in_prompt + sum(
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

        model_dir = self.get_model_dir_by_id(model_id)
        train_path = os.path.join(model_dir, "train_data.json")

        category_name = list(model_params['category_id_to_info'].values())[0]["category_name"]
        labeled_texts = {"pos": positives, "neg": negatives}
        model_components = WatsonXBinaryModelComponent(labeled_texts= {"pos": positives, "neg": negatives},
                                             is_zero_shot= len(train_data) == 0, category_name=category_name, available_tokens=None)
        available_tokens = self._get_number_of_available_tokens(labeled_texts, model_components)
        model_components.available_tokens = available_tokens
        with open(train_path, "w") as train_file:
            train_file.write(json.dumps(asdict(model_components)))

        self.save_curl_instruction_to_file(labeled_texts=labeled_texts,
                                           model_components=model_components, model_dir=model_dir)

    def build_prompt(self, texts, labeled_texts, model_components):
        positive_texts = labeled_texts["pos"]
        negative_texts = labeled_texts["neg"]

        positives = (
            [f"text: {t}\n{self.get_category_prompt()}: {self.get_pos_label(model_components.category_name)}" for t in positive_texts])
        negatives = (
            [f"text: {t}\n{self.get_category_prompt()}: {self.get_neg_label(model_components.category_name)}" for t in negative_texts])
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
            prompts = ["\n".join([f"{self.get_instruction(model_components)} ",
                                  f"{few_shot_examples}", f"text: {text}", f"{self.get_category_prompt()}: "])
                       for text in texts]
        else:
            prompts = ["\n".join(
                [f"{self.get_instruction(model_components)} ", f"text: {text}", f"{self.get_category_prompt()}: "])
                       for text in texts]
        return prompts

    def extract_predictions(self, response, model_components):
        score = float(numpy.prod(numpy.exp([x.logprob for x in response.generated_tokens])))
        return (Prediction(True, score) if response.generated_text.lower().strip() == self.get_pos_label(
            model_components.category_name) else Prediction(
            False, 1 - score))


class BinaryFewShotFlanT5XXLWatsonx(FewShotsWatsonXModelBinary):
    def __init__(self, output_dir, background_jobs_manager):
        super(BinaryFewShotFlanT5XXLWatsonx, self).__init__(output_dir, background_jobs_manager, ModelType.FLAN_T5_11B)

class TunableWatsonXModel(WatsonXBaseModel):
    def __init__(self, output_dir, background_jobs_manager, watsonx_model_type: str, prompt_type: PromptType, tune_type):
        super(TunableWatsonXModel, self).__init__(output_dir, background_jobs_manager, gpu_support=False,
                                                 prompt_type=prompt_type,
                                                 watsonx_model_type=watsonx_model_type,
                                                  api_endpoint=cash_api_name_to_endpoint["BAM"])
        self.train_seq_len = 256
        self.accumulate_steps = 16
        self.train_batch_size = 16
        self.learning_rate = 0.3
        self.num_epochs = 50
        self.tune_method = tune_type

    def _train(self, model_id: str, train_data: Sequence[Mapping], model_params: Mapping):
        additional_training_data = self.prepare_training_data(model_params, train_data)
        verbalizer = additional_training_data["verbalizer"]
        labels = additional_training_data["labels"]
        model_out_dir = self.get_model_dir_by_id(model_id)
        model_name = ""
        if len(train_data) > 0:
            # prepare and upload the train data
            tokenizer = self._get_tokenizer()
            verbalizer_len = len(tokenizer(verbalizer)["input_ids"])
            orig_texts = [ex['text'] for ex in train_data]
            texts = [self._cut_text(t, self.train_seq_len - verbalizer_len, tokenizer)
                         for t in orig_texts]
            logging.info(self._get_cut_stat(orig_texts, texts))

            train_file_id = self.upload_train_data(texts, labels, model_out_dir)

            # submit multi prompt tuning
            api_key = self.zero_shot_model.service.key
            URL = self.zero_shot_model.service.service_url
            headers = {"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}
            if self.is_multiclass:
                model_name =  f'Label Sleuth tune model for {len(model_params["category_id_to_info"])} categories on {len(train_data)} examples'
            else:
                model_name =  f'Label Sleuth tune model for {model_params["category_name"]} on {len(train_data)} examples'

            data = {
                'name': model_name,
                'model_id': self.platform_model_type,
                'task_id': 'classification',
                'method_id': self.tune_method,
                'training_file_ids': [train_file_id],
                'parameters': {
                    'accumulate_steps': self.accumulate_steps,
                    'batch_size': self.train_batch_size,
                    'learning_rate': self.learning_rate,
                    'num_epochs': self.num_epochs,
                    'verbalizer': verbalizer
                }
            }
            if self.tune_method == "pt":
                data['parameters']['init_method']= 'TEXT'
                data['parameters']['init_text'] = "Classify the text into one of the following categories: " + \
                                                  ", ".join(additional_training_data.get("ordered_class_names"))
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
            tune_id = self.str_model_name


        # save the tune result
        category_name_to_id = {y["category_name"]: x for x, y in model_params['category_id_to_info'].items()}
        if self.is_multiclass:
            model_components = WatsonXTunableMCModelComponent(category_name_to_id=category_name_to_id,
                                                             tune_id=tune_id,
                                                             is_zero_shot=len(train_data) == 0,
                                                             labeled_texts=train_data,
                                                             available_tokens=None,
                                                             sorted_categories_by_freq = additional_training_data.get("sorted_categories_by_freq"),
                                                            class_names_in_verbalizer = additional_training_data.get("class_names_in_verbalizer", False))

        else:
            model_components = WatsonXTunableBinaryModelComponent(category_name=model_params["category_name"],
                                                                 tune_id=tune_id,
                                                                 is_zero_shot=len(train_data) == 0,
                                                                 labeled_texts=train_data,
                                                                 available_tokens=None)
        with open(os.path.join(model_out_dir, 'tune_res.json'), 'w') as f:
            json.dump(asdict(model_components),f)
        self.save_curl_instruction_to_file(labeled_texts={},
                                           model_components=model_components, model_dir=model_out_dir)


    @abstractmethod
    def prepare_training_data(self, model_params, train_data):
        raise NotImplementedError

    def upload_train_data(self, inputs, outputs, model_dir):
        res = []
        for inp, outp in zip(inputs, outputs):
            res.append({"input": inp, "output": outp})
        temp_file = os.path.join(model_dir, 'train_data.json')
        with open(temp_file, "w") as f:
            json.dump(res, f)

        headers = {'Authorization': f'Bearer {self.zero_shot_model.service.key}'}
        URL = self.zero_shot_model.service.service_url + '/files'
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
        tune_id = model_components.tune_id
        tuned_model = Model(self.platform_model_type, params=self.zero_shot_model.params,
                            credentials=Credentials(api_key=self.zero_shot_model.service.key,
                                                    api_endpoint=self.zero_shot_model.service.service_url))
        tuned_model.model = tune_id
        return self.infer_with_category_and_few_shot(items_to_infer, tuned_model, model_components)

    def _process_infer_response(self, response):
        return response


    def build_prompt(self, texts, labeled_texts, model_components):
        if model_components.is_zero_shot or not model_components.class_names_in_verbalizer:
            return [self.get_instruction(model_components).replace("{{input}}", text) for text in texts]
        return texts

class TunableWatsonXModelBinary(TunableWatsonXModel):
    def __init__(self, output_dir, background_jobs_manager, watsonx_model_type, tune_type):
        super(TunableWatsonXModelBinary, self).__init__(output_dir, background_jobs_manager, watsonx_model_type,
                                                        prompt_type=PromptType.CLS_NO_CLS, tune_type=tune_type)

    def extract_predictions(self, response, model_component):
        score = float(numpy.prod(numpy.exp([x.logprob for x in response.generated_tokens])))
        return (Prediction(True, score) if response.generated_text.lower().strip() == self.get_pos_label(
            model_component.category_name) else Prediction(
            False, 1 - score))

    def prepare_training_data(self, model_params, train_data):
        category_name = list(model_params['category_id_to_info'].values())[0]["category_name"]
        pos_label = category_name
        neg_label = f'not {category_name}'
        verbalizer = 'classify { "' + pos_label + '", "' + neg_label + '" } Input: {{input}} Output:'
        labels = [pos_label if ex['label'] else neg_label for ex in train_data]
        return {"category_name": category_name,
                "verbalizer": verbalizer,
                "labels": labels}

class TunableWatsonXModelMC(TunableWatsonXModel):
    def __init__(self, output_dir, background_jobs_manager, watsonx_model_type, tune_type):
        super(TunableWatsonXModelMC, self).__init__(output_dir, background_jobs_manager, watsonx_model_type,
                                                    PromptType.MULTICLASS, tune_type)

    def extract_predictions(self, response,  model_components):
        category_names = list(model_components.category_name_to_id.keys())
        score = float(numpy.prod(numpy.exp([x.logprob for x in response.generated_tokens])))
        # in case prediction is not in the classes list:
        predicted_class = response.generated_text.lower().strip()
        if predicted_class not in category_names:
            closest_class = difflib.get_close_matches(response.generated_text, category_names, n=1)
            if (len(closest_class)) > 0:
                predicted_class = closest_class[0]
            else:
                if model_components.sorted_categories_by_freq and len(model_components.sorted_categories_by_freq) > 0:
                    #this is initialized during tuning
                        predicted_class = model_components.sorted_categories_by_freq[0][0]

        predicted_label = model_components.category_name_to_id.get(predicted_class)
        if not predicted_label:
            #default label is the first in the categories list
            predicted_label = model_components.category_name_to_id.get(category_names[0])

        scores = {i: 0 for i in model_components.category_name_to_id.values()}
        scores[predicted_label] = score
        return MulticlassPrediction(label=predicted_label, scores=scores)

    def prepare_training_data(self, model_params, train_data):
        category_names = [x["category_name"] for x in model_params['category_id_to_info'].values()]
        labels = [model_params['category_id_to_info'].get(ex['label'])["category_name"] for ex in train_data]
        local_model_params = {}
        local_model_params["category_name_to_id"] = {y["category_name"]: x for x, y in model_params['category_id_to_info'].items()}
        sorted_categories_by_freq = None
        if len(labels) > 0:
            sorted_categories_by_freq = Counter(labels)
            all_categories_with_counts = {}
            all_categories_with_counts.update(sorted_categories_by_freq)
            all_categories_with_counts.update({x: 0 for x in category_names if x not in sorted_categories_by_freq})
            sorted_categories_by_freq = sorted(all_categories_with_counts.items(), key=lambda x: all_categories_with_counts.get(x[0]), reverse=True)
            local_model_params["sorted_categories_by_freq"] = sorted_categories_by_freq
        verbalizer, class_names_in_verbalizer, ordered_class_names = Multiclass_Verbalizer.get_instruction(self._get_tokenizer(),
                                                                                      self.train_seq_len,
                                                                                      is_train=True,
                                                                                      category_names=category_names,
                                                                                      sorted_categories_by_freq=sorted_categories_by_freq)
        additional_data = ({
                "verbalizer": verbalizer,
                "labels": labels,
                "class_names_in_verbalizer": class_names_in_verbalizer,
                "sorted_categories_by_freq": sorted_categories_by_freq,
                "ordered_class_names": ordered_class_names
        })

        return additional_data


class MulticlassFlanT5XLWatsonxPT(TunableWatsonXModelMC):
    def __init__(self, output_dir, background_jobs_manager):
        super(MulticlassFlanT5XLWatsonxPT, self).__init__(output_dir, background_jobs_manager,
                                                          ModelType.FLAN_T5_3B, tune_type="pt")

class BinaryFlanT5XLWatsonxPT(TunableWatsonXModelBinary):
    def __init__(self, output_dir, background_jobs_manager):
        super(BinaryFlanT5XLWatsonxPT, self).__init__(output_dir, background_jobs_manager,
                                                          ModelType.FLAN_T5_3B, tune_type="pt")

