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

from typing import Mapping, Sequence

from label_sleuth.data_access.core.data_structs import TextElement


def convert_text_elements_to_train_data(elements: Sequence[TextElement], category_id) -> Sequence[Mapping]:
    """
    Convert a list of text elements to the expected format for training a model.
    :param elements: a list of TextElement objects
    :param category_id:
    :return: a list of dictionaries with at least the "text" and "label" fields, e.g. [{'text': 'text1', 'label': True,
    'additional_field': 'value1'}, {'text': 'text2', 'label': False,  'additional_field': 'value2'}]
    """
    labels = [element.category_to_label[category_id].label for element in elements]
    metadata = [element.category_to_label[category_id].metadata for element in elements]

    converted_data = [{"text": element.text, "label": label, **example_metadata}
                      for element, label, example_metadata in zip(elements, labels, metadata)]
    return converted_data


