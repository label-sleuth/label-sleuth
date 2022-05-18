from typing import Sequence

from lrtc_lib.orchestrator.core.state_api.orchestrator_state_api import Iteration


def extract_iteration_information_list(iterations: Sequence[Iteration]):
    res_list = \
        [{'model_id': iteration_index,  # TODO change key
          'model_status': iteration.model.model_status.name,
          'creation_epoch': iteration.model.creation_date.timestamp(),
          'model_type': iteration.model.model_type.name,
          # The UI expects a dict of string to int, and train counts contains a mix of boolean and string keys.
          'model_metadata': {**iteration.model.model_metadata, **iteration.iteration_statistics, "train_counts":
              {str(k).lower(): v for k, v in iteration.model.model_metadata["train_counts"].items()}},
          'active_learning_status':
              iteration.status.name}
         for iteration_index, iteration in enumerate(iterations)]

    res_sorted = [{**model_dict, 'iteration': i} for i, model_dict in enumerate(
        sorted(res_list, key=lambda item: item['creation_epoch']))]

    return res_sorted
