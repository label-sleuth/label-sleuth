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

import unittest
from collections import defaultdict

from unittest.mock import MagicMock

from label_sleuth.analysis_utils.labeling_reports import get_suspected_labeling_contradictions_by_distance
from label_sleuth.data_access.core.data_structs import TextElement, Label, LabelType
from label_sleuth.models.core.languages import Languages


class TestLabelingReports(unittest.TestCase):

    def setUp(self) -> None:
        self.embedding_func_mock = MagicMock()

        def side_effect(texts, language):
            text_to_embedding = {"almost identical text 1": [0.9, 0.9, 0.9],
                                 "almost identical text 2": [1, 1, 0.9],
                                 "almost identical text 3": [1, 0.9, 1],
                                 "almost identical text 4": [1, 1, 1]}
            return [text_to_embedding.get(text, [0, 0, 0]) for text in texts]

        self.embedding_func_mock.side_effect = side_effect

    def test_one_positive_one_negative(self):
        labeled_elements = [TextElement(uri="dataset-uri1",
                                        text='almost identical text 1',
                                        span=[(217, 377)], metadata={},
                                        category_to_label=defaultdict(Label, {3: Label(label=True, metadata={},
                                                                                       label_type=LabelType.Standard

                                                                                       )})),
                            TextElement(uri="dataset-uri2",
                                        text='almost identical text 3',
                                        span=[(108, 216)], metadata={},
                                        category_to_label=defaultdict(Label, {3: Label(label=False, metadata={},
                                                                                       label_type=LabelType.Standard

                                                                                       )}))]

        suspected_contradictions = get_suspected_labeling_contradictions_by_distance(3, labeled_elements,
                                                                                     self.embedding_func_mock,
                                                                                     Languages.ENGLISH)
        self.assertEqual(len(suspected_contradictions), 1)
        self.assertEqual(suspected_contradictions[0][0].text, "almost identical text 1")
        self.assertEqual(suspected_contradictions[0][1].text, "almost identical text 3")

    def test_one_positive_two_negatives(self):
        labeled_elements = [TextElement(uri="dataset-uri1",
                                        text='almost identical text 1',
                                        span=[(217, 377)], metadata={},
                                        category_to_label=defaultdict(Label, {3: Label(label=True, metadata={},
                                                                                       label_type=LabelType.Standard

                                                                                       )})),
                            TextElement(uri="dataset-uri2",
                                        text='almost identical text 2',
                                        span=[(108, 216)], metadata={},
                                        category_to_label=defaultdict(Label, {3: Label(label=False, metadata={},
                                                                                       label_type=LabelType.Standard

                                                                                       )})),
                            TextElement(uri="dataset-uri3",
                                        text='almost identical text 3',
                                        span=[(108, 216)], metadata={},
                                        category_to_label=defaultdict(Label, {3: Label(label=False, metadata={},
                                                                                       label_type=LabelType.Standard

                                                                                       )}))]

        suspected_contradictions = get_suspected_labeling_contradictions_by_distance(3, labeled_elements,
                                                                                     self.embedding_func_mock,
                                                                                     Languages.ENGLISH)
        self.assertEqual(len(suspected_contradictions), 2)
        self.assertEqual(suspected_contradictions[0][0].text, "almost identical text 1")
        self.assertEqual(suspected_contradictions[0][1].text, "almost identical text 2")
        self.assertEqual(suspected_contradictions[1][0].text, "almost identical text 1")
        self.assertEqual(suspected_contradictions[1][1].text, "almost identical text 3")

    def test_two_positives_two_negatives(self):
        labeled_elements = [TextElement(uri="dataset-uri1",
                                        text='almost identical text 1',
                                        span=[(217, 377)], metadata={},
                                        category_to_label=defaultdict(Label, {3: Label(label=True, metadata={},
                                                                                       label_type=LabelType.Standard

                                                                                       )})),
                            TextElement(uri="dataset-uri2",
                                        text='almost identical text 2',
                                        span=[(217, 377)], metadata={},
                                        category_to_label=defaultdict(Label, {3: Label(label=True, metadata={},
                                                                                       label_type=LabelType.Standard

                                                                                       )}))
            , TextElement(uri="dataset-uri3",
                          text='almost identical text 3',
                          span=[(108, 216)], metadata={},
                          category_to_label=defaultdict(Label, {3: Label(label=False, metadata={},
                                                                         label_type=LabelType.Standard

                                                                         )})),
                            TextElement(uri="dataset-uri4",
                                        text='almost identical text 4',
                                        span=[(108, 216)], metadata={},
                                        category_to_label=defaultdict(Label, {3: Label(label=False, metadata={},
                                                                                       label_type=LabelType.Standard

                                                                                       )}))]

        suspected_contradictions = get_suspected_labeling_contradictions_by_distance(3, labeled_elements,
                                                                                     self.embedding_func_mock,
                                                                                     Languages.ENGLISH)
        self.assertEqual(len(suspected_contradictions), 2)
        self.assertEqual(suspected_contradictions[0][0].text, "almost identical text 2")
        self.assertEqual(suspected_contradictions[0][1].text, "almost identical text 4")
        self.assertEqual(suspected_contradictions[1][0].text, "almost identical text 1")
        self.assertEqual(suspected_contradictions[1][1].text, "almost identical text 3")
