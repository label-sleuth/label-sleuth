from typing import Mapping, Sequence, Set

from sklearn.preprocessing import MultiLabelBinarizer

from lrtc_lib.data_access.core.data_structs import URI_SEP


def _convert_text_elements_to_train_data(data, category_name) -> Sequence[Mapping]:
    """
    convert textual labels to integers and convert to expected inference input format
    :param data:
    """
    labels = [element.category_to_label[category_name].label for element in data]
    metadata = [element.category_to_label[category_name].metadata for element in data]

    converted_data = [{"text": element.text, "label": label,
                       **example_metadata}
                      for element, label, example_metadata in zip(data, labels, metadata)]
    return converted_data


