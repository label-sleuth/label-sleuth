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
from typing import Sequence


@dataclass
class Language:
    """
    This dataclass contains some parameters that are language-specific. The parameter values can be used by the
    classification model implementations, as well as by some general utility functions in the *analysis_utils* module.
    """
    name: str
    stop_words: Sequence[str]
    spacy_model_name: str

    def __repr__(self):
        return self.name


English = \
    Language(name='English',
             stop_words=["a", "about", "above", "after", "again", "against", "ain", "all", "am", "an", "and", "any",
                         "are", "aren", "aren't", "as", "at", "be", "because", "been", "before", "being", "below",
                         "between", "both", "but", "by", "can", "couldn", "couldn't", "d", "did", "didn", "didn't",
                         "do", "does", "doesn", "doesn't", "doing", "don", "don't", "down", "during", "each", "few",
                         "for", "from", "further", "had", "hadn", "hadn't", "has", "hasn", "hasn't", "have", "haven",
                         "haven't", "having", "he", "her", "here", "hers", "herself", "him", "himself", "his", "how",
                         "i", "if", "in", "into", "is", "isn", "isn't", "it", "it's", "its", "itself", "just", "ll",
                         "m", "ma", "me", "mightn", "mightn't", "more", "most", "mustn", "mustn't", "my", "myself",
                         "needn", "needn't", "no", "nor", "not", "now", "o", "of", "off", "on", "once", "only", "or",
                         "other", "our", "ours", "ourselves", "out", "over", "own", "re", "s", "same", "shan", "shan't",
                         "she", "she's", "should", "should've", "shouldn", "shouldn't", "so", "some", "such", "t",
                         "than", "that", "that'll", "the", "their", "theirs", "them", "themselves", "then", "there",
                         "these", "they", "this", "those", "through", "to", "too", "under", "until", "up", "ve", "very",
                         "was", "wasn", "wasn't", "we", "were", "weren", "weren't", "what", "when", "where", "which",
                         "while", "who", "whom", "why", "will", "with", "won", "won't", "wouldn", "wouldn't", "y",
                         "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves",
                         "could", "he'd", "he'll", "he's", "here's", "how's", "i'd", "i'll", "i'm", "i've", "let's",
                         "ought", "she'd", "she'll", "that's", "there's", "they'd", "they'll", "they're", "they've",
                         "we'd", "we'll", "we're", "we've", "what's", "when's", "where's", "who's", "why's", "would"],
             spacy_model_name='en_core_web_lg')


class Languages:
    ENGLISH = English
