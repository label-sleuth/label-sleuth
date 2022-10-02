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

import logging
import re
import os
import shutil
import string
import sys
import tarfile
import tempfile
import threading

from collections import defaultdict
from enum import Enum
from typing import List

import numpy as np
import requests
import spacy
from tqdm.auto import tqdm

from label_sleuth.models.core.languages import Language, Languages


class RepresentationType(Enum):
    GLOVE = 1
    BOW = 2


class SentenceEmbeddingService:
    def __init__(self, embedding_model_dir, preload_spacy_model_name=None):
        self.spacy_models_path = os.path.join(embedding_model_dir, "spacy_models")
        os.makedirs(self.spacy_models_path, exist_ok=True)
        self.spacy_models = defaultdict(lambda: None)
        self.spacy_model_lock = threading.Lock()
        if preload_spacy_model_name is not None:
            self.load_or_download_spacy_model(preload_spacy_model_name)

    def get_glove_representation(self, sentences: List[str],
                                 language: Language = Languages.ENGLISH) -> List[np.ndarray]:
        """
        Given a list of texts, return a list of GloVe-based representation vectors. Each text is represented by the
        mean of the vector representations of its consisting tokens.
        :param sentences:
        :param language:
        :return: a list of numpy vectors. Vector length depends on the representation model specified under *language*
        """
        model_name = language.spacy_model_name

        # The model used for calculating the representations
        spacy_model = self.get_spacy_model(model_name)

        sentences = remove_stop_words_and_punctuation(sentences, language=language)
        # remove out-of-vocabulary tokens
        sentences = [' '.join(token for token in sent.split() if spacy_model.vocab.has_vector(token))
                     for sent in sentences]
        # the vector obtained by *make_doc(X).vector* is an average of the representations for the
        # individual tokens in X
        embeddings = [spacy_model.make_doc(sent).vector for sent in sentences]
        logging.info(f"Done getting GloVe representations for {len(embeddings)} sentences")
        return embeddings

    def get_spacy_model(self, model_name) -> spacy.Language:
        """
        The model is loaded once, on the first time this method is called. On
        subsequent calls, the loaded model is read from the spacy_models dictionary
        """
        with self.spacy_model_lock:
            if self.spacy_models[model_name] is None:
                self.spacy_models[model_name] = self.load_or_download_spacy_model(model_name)
        return self.spacy_models[model_name]

    @staticmethod
    def download_spacy_model(model_name, output_path):
        """
        The default spacy download method installs spacy models via pip install, which is unsuitable for some
        deployment and packaging scenarios. Thus, in this method we download the spacy model archive manually, and
        then place the model files inside the Label Sleuth output directory.
        See https://spacy.io/usage/models#download-manual

        """
        from spacy.cli._util import SDIST_SUFFIX
        from spacy.cli.download import get_compatibility, get_version

        # get the url for the relevant version of the requested spacy model
        compatibility = get_compatibility()
        model_version = get_version(model_name, compatibility)
        model_with_version = f'{model_name}-{model_version}'
        full_download_url = f'{spacy.about.__download_url__}/{model_with_version}/{model_with_version}{SDIST_SUFFIX}'

        # download the archive file
        temp_path = tempfile.TemporaryDirectory().name
        with requests.get(full_download_url, stream=True) as response:
            total_length = int(response.headers.get("Content-Length"))
            with tqdm.wrapattr(response.raw, "read", total=total_length, desc="Downloading spacy model") as raw:
                with open(temp_path, 'wb') as output:
                    shutil.copyfileobj(raw, output)

        tar = tarfile.open(temp_path)
        temp_path_2 = tempfile.TemporaryDirectory().name
        # extract the relevant directory from the archive (https://spacy.io/usage/models#download-manual)
        path_to_model_files = f'{model_with_version}/{model_name}/{model_with_version}'
        tar.extractall(members=[x for x in tarfile.open(temp_path).getmembers()
                                if x.name.startswith(path_to_model_files)],
                       path=temp_path_2)

        # move the model files to the Label Sleuth output directory
        shutil.move(os.path.join(temp_path_2, path_to_model_files), output_path)

    def load_or_download_spacy_model(self, model_name) -> spacy.Language:
        """
        Load or download a spacy model by name, and place it inside self.spacy_models_path
        """
        model_path = os.path.join(self.spacy_models_path, model_name)
        if os.path.exists(model_path):
            return spacy.load(model_path)

        logging.info(f"Spacy model does not exist in {model_path}, downloading...")
        self.download_spacy_model(model_name, model_path)
        model = spacy.load(model_path)
        return model


def remove_stop_words_and_punctuation(sentences: List[str], language=Languages.ENGLISH) -> List[str]:
    # remove punctuation
    sentences = remove_punctuation(sentences)
    # remove stop words
    regex = r"\b(" + "|".join(language.stop_words) + r")\b"
    sentences = [re.sub(regex, r"", text) for text in sentences]
    # remove extra spaces
    sentences = [' '.join(sent.split()) for sent in sentences]
    return sentences


def remove_punctuation(sentences: List[str]) -> List[str]:
    punctuation = string.punctuation + '•●'
    sentences = [t.translate(t.maketrans(punctuation, ' ' * len(punctuation))) for t in sentences]
    return sentences
