from typing import Mapping, Sequence

from lrtc_lib.data_access.core.data_structs import TextElement


def _convert_text_elements_to_train_data(elements: Sequence[TextElement], category_name) -> Sequence[Mapping]:
    """
    Convert a list of text elements to the expected format for training a model.
    :param elements: a list of TextElement objects
    :param category_name:
    :return: a list of dictionaries with at least the "text" and "label" fields, e.g. [{'text': 'text1', 'label': True,
    'additional_field': 'value1'}, {'text': 'text2', 'label': False,  'additional_field': 'value2'}]
    """
    labels = [element.category_to_label[category_name].label for element in elements]
    metadata = [element.category_to_label[category_name].metadata for element in elements]

    converted_data = [{"text": element.text, "label": label, **example_metadata}
                      for element, label, example_metadata in zip(elements, labels, metadata)]
    return converted_data


