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

from collections import Counter

from scipy.stats import hypergeom
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_selection import mutual_info_classif

from label_sleuth.models.core.languages import Languages
from label_sleuth.models.core.tools import remove_stop_words_and_punctuation, remove_punctuation


def ngrams_by_info_gain(texts, relevant_labels, ngram_max_length, language=Languages.ENGLISH):
    cv = CountVectorizer(max_df=0.95, min_df=2, max_features=3000, ngram_range=(1, ngram_max_length),
                         stop_words=language.stop_words)
    x_vec = cv.fit_transform(texts)
    res = dict(zip(cv.get_feature_names_out(),
                   mutual_info_classif(x_vec, relevant_labels, discrete_features=True) * 100))
    return sorted(res.items(), key=lambda x: x[1], reverse=True)


def ngrams_by_hypergeometric_test(texts, relevant_labels, ngram_max_length, bonferroni_correction=False,
                                  language=Languages.ENGLISH, ngrams=None):
    positive_labels = {1, '1', True, True, True}
    positive_texts = [text for text, label in zip(texts, relevant_labels) if label in positive_labels]
    negative_texts = [text for text, label in zip(texts, relevant_labels) if label not in positive_labels]
    positive_ngrams = extract_ngrams(positive_texts, ngram_max_length, language=language)
    negative_ngrams = extract_ngrams(negative_texts, ngram_max_length, language=language)
    positive_counts = Counter(positive_ngrams)
    negative_counts = Counter(negative_ngrams)
    total_counts = positive_counts + negative_counts
    vocab = set(positive_ngrams + negative_ngrams)
    if ngrams:
        tokens_and_pvals = [(ngram, hypergeom.sf(positive_counts[ngram] - 1, sum(total_counts.values()),
                                                 sum(positive_counts.values()), total_counts[ngram]))
                            for ngram in ngrams if positive_counts[ngram] > 2]
    else:
        tokens_and_pvals = [(ngram, hypergeom.sf(positive_counts[ngram] - 1, sum(total_counts.values()),
                                                 sum(positive_counts.values()), total_counts[ngram]))
                            for ngram in vocab if positive_counts[ngram] > 2]
    if bonferroni_correction:
        # apply Bonferroni correction - multiply by number of comparisons
        tokens_and_pvals = [(ngram, p*len(tokens_and_pvals)) for ngram, p in tokens_and_pvals]
    return sorted(tokens_and_pvals, key=lambda x: x[1])


def extract_ngrams(texts, ngram_max_length, language=Languages.ENGLISH):
    unigrams = [token.lower() for text in remove_stop_words_and_punctuation(texts, language=language)
                for token in set(text.split())]
    ngrams = []
    for n in range(2, ngram_max_length+1):
        ngrams.extend(
            [' '.join(x) for text in remove_punctuation(texts)
             for x in zip(*[text.lower().split()[i:] for i in range(n)])]
        )
    return unigrams + ngrams


def get_token_overlap(text_a, text_b) -> float:
    a_tokens = set(text_a.lower().split())
    b_tokens = set(text_b.lower().split())
    intersection = a_tokens.intersection(b_tokens)
    overlap = len(intersection) / max(len(a_tokens), len(b_tokens))
    return overlap
