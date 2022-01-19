from typing import Mapping, Sequence, Set

from sklearn.preprocessing import MultiLabelBinarizer


def _convert_to_dicts_with_numeric_labels(data, category_name, all_category_labels: Set[str]) -> Sequence[Mapping]:
    """
    convert textual labels to integers and convert to expected inference input format
    :param data:
    """
    labels = [element.category_to_label[category_name].labels for element in data]
    metadata = [element.category_to_label[category_name].metadata for element in data]
    is_multi_label = {len(x) for x in labels} != {1}
    if is_multi_label:
        mlb = MultiLabelBinarizer(classes=sorted(all_category_labels)).fit(None)
        label_vectors = mlb.transform([list(x) for x in labels])
        converted_data = [{"text": element.text, "label": label_vector}
                          for element, label_vector in zip(data, label_vectors)]
    else:
        text_to_number = {label: i for i, label in enumerate(sorted(all_category_labels))}
        converted_data = [{"text": element.text, "label": text_to_number[next(iter(label_set))],
                           **example_metadata}
                          for element, label_set, example_metadata in zip(data, labels, metadata)]
    return converted_data