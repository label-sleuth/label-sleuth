
from collections import defaultdict
from dataclasses import dataclass

from typing import List, Tuple, Mapping

LABEL_POSITIVE = True # TODO change to boolean....good luck
LABEL_NEGATIVE = False
BINARY_LABELS = frozenset({LABEL_NEGATIVE, LABEL_POSITIVE})


@dataclass
class TextElement:
    uri: str
    text: str
    span: List[Tuple]
    metadata: Mapping
    category_to_label: defaultdict

    @classmethod
    def get_field_names(cls):
        return cls.__annotations__.keys()


@dataclass
class Document:
    uri: str
    text_elements: List[TextElement]
    metadata: Mapping


@dataclass
class Label:
    labels: frozenset
    metadata: Mapping

    def __init__(self, labels, metadata: Mapping):
        if type(labels) in [int, str, bool]:
            self.labels = frozenset([labels])
        elif type(labels) == list:
            self.labels = frozenset(labels)
        else:
            self.labels = labels
        self.metadata = metadata

    def to_dict(self):
        dict_for_json = {'labels': list(self.labels), 'metadata': self.metadata}
        return dict_for_json


if __name__ == '__main__':
    l = Label(3,{})
    print(l)