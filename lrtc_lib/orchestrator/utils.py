from typing import Mapping, Sequence, Set

from sklearn.preprocessing import MultiLabelBinarizer


def _convert_to_dicts_with_numeric_labels(data, category_name, all_category_labels: Set[str]) -> Sequence[Mapping]:
    """
    convert textual labels to integers and convert to expected inference input format
    :param data:
    """
    labels = [element.category_to_label[category_name].label for element in data]
    metadata = [element.category_to_label[category_name].metadata for element in data]

    text_to_number = {label: i for i, label in enumerate(sorted(all_category_labels))}
    converted_data = [{"text": element.text, "label": text_to_number[label_set],
                       **example_metadata}
                      for element, label_set, example_metadata in zip(data, labels, metadata)]
    return converted_data