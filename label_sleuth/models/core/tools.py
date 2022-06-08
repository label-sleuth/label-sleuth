import logging
import re
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


spacy_models = defaultdict(lambda: None)
spacy_model_lock = threading.Lock()


def get_glove_representation(sentences: List[str], language: Language = Languages.ENGLISH) -> List[np.ndarray]:
    """
    Given a list of texts, return a list of GloVe-based representation vectors. Each text is represented by the mean of
    the vector representations of its consisting tokens.
    :param sentences:
    :param language:
    :return: a list of numpy vectors. The vector length depends on the representation model specified under *language*
    """
    model_name = language.spacy_model_name

    # The model used for calculating the representations is loaded once, on the first time this method is called. On
    # subsequent calls, the loaded model is read from the spacy_models dictionary
    with spacy_model_lock:
        if spacy_models[model_name] is None:
            logging.info(f"Loading spacy model {model_name} from disk")
            spacy_models[model_name] = spacy.load(model_name)
    spacy_model = spacy_models[model_name]

    sentences = remove_stop_words_and_punctuation(sentences, language=language)
    # remove out-of-vocabulary tokens
    sentences = [' '.join(token for token in sent.split() if spacy_model.vocab.has_vector(token)) for sent in sentences]
    # the vector obtained by *make_doc(X).vector* is an average of the representations for the individual tokens in X
    embeddings = [spacy_model.make_doc(sent).vector for sent in sentences]
    logging.info(f"Done getting GloVe representations for {len(embeddings)} sentences")
    return embeddings


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
