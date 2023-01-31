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

from dataclasses import dataclass, field
from enum import Enum

from typing import List, Tuple, Mapping

LABEL_POSITIVE = True
LABEL_NEGATIVE = False
BINARY_LABELS = frozenset({LABEL_NEGATIVE, LABEL_POSITIVE})
URI_SEP = "-"


class LabelType(Enum):
    Standard = 0
    Weak = 1


@dataclass
class Label:
    label: bool
    metadata: Mapping = field(default_factory=dict)
    label_type: LabelType = field(default=LabelType.Standard)

    def get_detailed_label_name(self):
        return str(self.label).lower() if self.label_type == LabelType.Standard \
            else f'{self.label_type.name}_{self.label}'.lower()

    def to_dict(self):
        dict_for_json = {'label': self.label, 'metadata': self.metadata, 'label_type': self.label_type.value}
        return dict_for_json

    def __post_init__(self):
        if type(self.label_type) == int:
            self.label_type = LabelType(self.label_type)


@dataclass
class TextElement:
    uri: str
    text: str
    span: List[Tuple]
    metadata: Mapping
    category_to_label: Mapping[int, Label]

    @classmethod
    def get_field_names(cls):
        return cls.__annotations__.keys()


@dataclass
class Document:
    uri: str
    text_elements: List[TextElement]
    metadata: Mapping


class DisplayFields:
    workspace_id = 'workspace_id'
    category_name = 'category_name'
    doc_id = 'document_id'
    dataset = 'dataset'
    text = 'text'
    uri = 'uri'
    element_metadata = 'element_metadata'
    label = 'label'
    label_metadata = 'label_metadata'  # TODO currently not supported
    label_type = 'label_type'
    csv_metadata_column_prefix = 'metadata_'
