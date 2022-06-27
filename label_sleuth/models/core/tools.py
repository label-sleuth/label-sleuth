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
import string
import threading

from collections import defaultdict
from enum import Enum
from typing import List

import numpy as np
import spacy

from label_sleuth.models.core.languages import Language, Languages


class RepresentationType(Enum):
    GLOVE = 1
    BOW = 2


class SentenceEmbeddingService:
    def __init__(self, output_dir, preload_spacy_model_name=None):
        self.spacy_models_path = os.path.join(output_dir, "spacy_models")
        os.makedirs(self.spacy_models_path, exist_ok=True)
        self.spacy_models = defaultdict(lambda: None)
        self.spacy_model_lock = threading.Lock()
        if preload_spacy_model_name is not None:
            self.load_or_download_spacy_model(preload_spacy_model_name)

    def get_glove_representation(self, sentences: List[str],
                                 language: Language = Languages.ENGLISH) -> List[np.ndarray]:
        """
        Given a list of texts, return a list of GloVe-based representation vectors. Each text is represented by the mean of
        the vector representations of its consisting tokens.
        :param sentences:
        :param language:
        :return: a list of numpy vectors. The vector length depends on the representation model specified under *language*
        """
        model_name = language.spacy_model_name

        # The model used for calculating the representations
        spacy_model = self.get_spacy_model(model_name)

        sentences = remove_stop_words_and_punctuation(sentences, language=language)
        # remove out-of-vocabulary tokens
        sentences = [' '.join(token for token in sent.split() if spacy_model.vocab.has_vector(token)) for sent in sentences]
        # the vector obtained by *make_doc(X).vector* is an average of the representations for the individual tokens in X
        embeddings = [spacy_model.make_doc(sent).vector for sent in sentences]
        logging.info(f"Done getting GloVe representations for {len(embeddings)} sentences")
        return embeddings

    def get_spacy_model(self, model_name):
        """
        The model is loaded once, on the first time this method is called. On
        subsequent calls, the loaded model is read from the spacy_models dictionary
        """
        with self.spacy_model_lock:
            if self.spacy_models[model_name] is None:
                #logging.info(f"Loading spacy model {model_name} from disk")
                self.spacy_models[model_name] = self.load_or_download_spacy_model(model_name)
        return self.spacy_models[model_name]

    def load_or_download_spacy_model(self, model_name):
        """
        load or download spacy model by name.
        Since there is no way to control the download destination for spacy models, the model is downloaded and then
        saved into the output dir.
        """
        model_path = os.path.join(self.spacy_models_path, model_name)
        if os.path.exists(model_path):
            return spacy.load(model_path)
        logging.info(f"Spacy model does not exist in {model_path}, downloading...")
        spacy.cli.download(model_name)
        model = spacy.load(model_name)
        model.to_disk(model_path)

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
