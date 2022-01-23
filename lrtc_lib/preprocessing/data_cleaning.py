import re


def cleanse(text):

    # We remove the paragraphs indication
    # 1) or 1.1) or 1. or (1)
    text = re.sub(r'^\s*\(?\d+(\.\d+)*[\)\.]?', ' ', text)
    # i) or ii) or ii.
    text = re.sub(r'^\s*\(?[a-z]+[\)\.]', ' ', text)
    # A) or B or (A).
    text = re.sub(r'^\s*\(?[A-Z]+[\)\.]', ' ', text)
    return text


def normalize(text):
    # We remove tokens which do not contain an alphabetic character
    text = re.sub(r'\b[^a-zA-Z]+\b', ' ', text)

    # We remove the punctuation
    text = re.sub(r"[,@\'?\.$%_;]", " ", text)

    # we remove redundant spaces
    text = ' '.join(text.split())

    # lowe case
    return text.lower()


# returns a normalized sentence
def clean_sentence(sentence_text):
    # untagged_sent = untag_html(sentence_text)
    # cleansed_sent = cleanse(untagged_sent)
    normalized_sent = normalize(sentence_text)
    return normalized_sent
