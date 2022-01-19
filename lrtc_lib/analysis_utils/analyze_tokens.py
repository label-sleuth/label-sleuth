from collections import Counter

from scipy.stats import hypergeom
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_selection import mutual_info_classif

from lrtc_lib.models.core.languages import Languages
from lrtc_lib.models.core.tools import remove_stop_words_and_punctuation, remove_punctuation


def ngrams_by_info_gain(texts, relevant_labels, ngram_max_length, language=Languages.ENGLISH):
    cv = CountVectorizer(max_df=0.95, min_df=2, max_features=3000, ngram_range=(1, ngram_max_length),
                         stop_words=language.stop_words)
    x_vec = cv.fit_transform(texts)
    res = dict(zip(cv.get_feature_names(), mutual_info_classif(x_vec, relevant_labels, discrete_features=True) * 100))
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
