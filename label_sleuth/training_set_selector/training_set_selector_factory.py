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
from label_sleuth.data_access.core.data_structs import LabelType
from label_sleuth.data_access.data_access_api import DataAccessApi
from label_sleuth.training_set_selector.train_set_selectors import TrainSetSelectorAllLabeled, \
    TrainSetSelectorEnforcePositiveNegativeRatio
from label_sleuth.training_set_selector.train_set_selector_api import TrainingSetSelectionStrategy


def get_training_set_selector(data_access: DataAccessApi, strategy=TrainingSetSelectionStrategy.ALL_LABELED):
    if strategy == TrainingSetSelectionStrategy.ALL_LABELED:
        return TrainSetSelectorAllLabeled(data_access, label_types={LabelType.Standard})
    elif strategy == TrainingSetSelectionStrategy.ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_EQUAL_RATIO:
        return TrainSetSelectorEnforcePositiveNegativeRatio(data_access, label_types={LabelType.Standard},
                                                            required_negative_ratio=1)
    elif strategy == TrainingSetSelectionStrategy.ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_X2_RATIO:
        return TrainSetSelectorEnforcePositiveNegativeRatio(data_access, label_types={LabelType.Standard},
                                                            required_negative_ratio=2)
    elif strategy == TrainingSetSelectionStrategy.ALL_LABELED_PLUS_UNLABELED_AS_NEGATIVE_X10_RATIO:
        return TrainSetSelectorEnforcePositiveNegativeRatio(data_access, label_types={LabelType.Standard},
                                                            required_negative_ratio=10)
    elif strategy == TrainingSetSelectionStrategy.ALL_LABELED_INCLUDE_WEAK:
        return TrainSetSelectorAllLabeled(data_access, label_types={LabelType.Standard, LabelType.Weak})
    elif strategy == TrainingSetSelectionStrategy.ALL_LABELED_INCLUDE_WEAK_PLUS_UNLABELED_AS_NEGATIVE_EQUAL_RATIO:
        return TrainSetSelectorEnforcePositiveNegativeRatio(data_access,
                                                            label_types={LabelType.Standard, LabelType.Weak},
                                                            required_negative_ratio=1)
    elif strategy == TrainingSetSelectionStrategy.ALL_LABELED_INCLUDE_WEAK_PLUS_UNLABELED_AS_NEGATIVE_X2_RATIO:
        return TrainSetSelectorEnforcePositiveNegativeRatio(data_access,
                                                            label_types={LabelType.Standard, LabelType.Weak},
                                                            required_negative_ratio=2)
    elif strategy == TrainingSetSelectionStrategy.ALL_LABELED_INCLUDE_WEAK_PLUS_UNLABELED_AS_NEGATIVE_X10_RATIO:
        return TrainSetSelectorEnforcePositiveNegativeRatio(data_access,
                                                            label_types={LabelType.Standard, LabelType.Weak},
                                                            required_negative_ratio=10)

    else:
        raise Exception(f"{strategy} is not supported")
