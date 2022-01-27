
from collections import defaultdict
from dataclasses import dataclass

from typing import List, Tuple, Mapping

LABEL_POSITIVE = True
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

class LabelType(Enum):
    Standard = ""
    Weak = "Weak"

@dataclass
class Label:
    label: bool
    metadata: Mapping

    def __init__(self, label: bool, metadata=None, label_type: LabelType = LabelType.Standard):

        if metadata is None:
            metadata = {}
        self.label = label
        self.metadata = metadata
        self.label_type = label_type

    def get_detailed_label_name(self):
        return self.label if self.label_type == LabelType.Standard else f'{self.label_type}_{self.label}'

    def to_dict(self):
        dict_for_json = {'label': self.label, 'metadata': self.metadata}
        return dict_for_json
