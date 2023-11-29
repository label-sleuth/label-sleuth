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

import tempfile
import time
import unittest

from label_sleuth.models.core.languages import Languages
from label_sleuth.models.core.model_api import ModelStatus
from label_sleuth.models.core.tools import SentenceEmbeddingService
from label_sleuth.models.svm import MulticlassSVM_BOW
from label_sleuth.orchestrator.background_jobs_manager import BackgroundJobsManager


class TestEnsembleModel(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()

        self.svm = MulticlassSVM_BOW(self.temp_dir.name, BackgroundJobsManager(),
                                     SentenceEmbeddingService(self.temp_dir.name,background_jobs_manager=None))

    def test_svm_bow_train_and_infer(self):
        model_id = self.svm.train(
            [
                {
                    "text": "If you choose to decline cookies, some parts of the Airbnb Platform may not work as intended or may not work at all.",
                    "label": 2},
                {
                    "text": "As a condition to using Services, you are required to open an account with 500px and select a password and username, and to provide registration information.The registration information you provide must be accurate, complete, and current at all times.",
                    "label": 0},
                {
                    "text": "§ You must opt-out separately from each computer or device and browser that you use to access our Sites and if you clear your cookies, you will need to repeat the opt-out process.",
                    "label": 3},
                {
                    "text": "Please note that if you request the erasure of your personal information: We may retain some of your personal information as necessary for our legitimate business interests, such as fraud detection and prevention and enhancing safety.For example, if we suspend an Airbnb Account for fraud or safety reasons, we may retain certain information from that Airbnb Account to prevent that Member from opening a new Airbnb Account in the future.We may retain and use your personal information to the extent necessary to comply with our legal obligations.For example, Airbnb and Airbnb Payments may keep some of your information for tax, legal reporting and auditing obligations.<",
                    "label": 0},
                {
                    "text": "Additionally, Microsoft partners with third-party ad companies to help provide some of our advertising services, and we also allow other third-party ad companies to display advertisements on our sites.These third parties may place cookies on your computer and collect data about your online activities across websites or online services.",
                    "label": 3},
                {
                    "text": "By posting Visual Content to the Site, you grant to 500px a non-exclusive or exclusive, transferable, fully paid, worldwide license to use, sublicense, distribute, reproduce, modify, adapt, publicly perform and publicly display such Visual Content in connection with the Services.This license will exist for the period during which the Visual Content is posted on the Site and will automatically terminate upon the removal of the Visual Content from the Site, subject to the terms of any license granted by an authorized 500px distributor;The license granted to 500px includes the right to use Visual Content fully or partially for promotional reasons and to distribute and redistribute Visual Content to other parties, websites, authorized agents, applications, and other entities, provided such Visual Content is attributed in accordance with the required credits (i.e.username or collection name, profile picture, photo title, descriptions, tags, and other accompanying information) if any and as appropriate, as submitted to 500px, subject to any credit requirements governing the licensing of Visual Content pursuant to the Contributor Agreement (notwithstanding the foregoing, no inadvertent failure to provide appropriate attribution shall be considered a breach of these Terms);500px and its distributors have the right to modify, alter and amend photo titles, descriptions, tags, metadata and other accompanying information for any Visual Content and the right to submit Visual Content to other parties and authorized agents for the purpose of creating tags for Visual Content;",
                    "label": 0},
                {
                    "text": "Other Data Partners use cookies and other tracking technologies to enable the delivery of interest-based advertising to users.",
                    "label": 3},
                {
                    "text": "500px reserves the right, at its sole discretion, to modify or replace the Terms at any time.If the alterations constitute a material change to the Terms, 500px will notify you by posting an announcement on the Site.What constitutes a material change will be determined at 500px’s sole discretion.You are responsible for reviewing and becoming familiar with any such modifications.Using any Service or viewing any Visual Content constitutes your acceptance of the Terms as modified.",
                    "label": 0},
                {
                    "text": "Third-parties who provide us with products and services may also place cookies, ad tags and/or beacons that collect the information outlined above in order to provide us with products and services including: Analytics tools (e. g. , Google Analytics) allowing us to analyze the performance of our Services.",
                    "label": 3},
                {
                    "text": "It also enables us to serve you advertising and other relevant content on and off of the Academia.edu Services.",
                    "label": 0},
                {
                    "text": "Information about our use of cookies and how you can change your cookie settings can be found here.",
                    "label": 3},
                {
                    "text": "If Airbnb undertakes or is involved in any merger, acquisition, reorganization, sale of assets, bankruptcy, or insolvency event, then we may sell, transfer or share some or all of our assets, including your information",
                    "label": 0},
                {
                    "text": "We use cookies and other similar technologies, such as web beacons, pixels, and mobile identifiers.",
                    "label": 3},
                {"text": "a binding arbitration administered by the American Arbitration Association (“AAA”)", "label": 0},
                {
                    "text": "We may also use third party cookies for the purposes of web analytics, attribution and error management.",
                    "label": 3},
                {
                    "text": "YOU AND 500PX AGREE THAT ANY PROCEEDINGS TO RESOLVE OR LITIGATE ANY DISPUTE ARISING HEREUNDER WILL BE CONDUCTED SOLELY ON AN INDIVIDUAL BASIS, AND THAT YOU WILL NOT SEEK TO HAVE ANY DISPUTE HEARD AS A CLASS ACTION, A REPRESENTATIVE ACTION, A COLLECTIVE ACTION, A PRIVATE ATTORNEY-GENERAL ACTION, OR IN ANY PROCEEDING IN WHICH YOU ACT OR PROPOSE TO ACT IN A REPRESENTATIVE CAPACITY.YOU FURTHER AGREE THAT NO PROCEEDING WILL BE JOINED, CONSOLIDATED, OR COMBINED WITH ANOTHER PROCEEDING WITHOUT THE PRIOR WRITTEN CONSENT OF 500PX AND ALL PARTIES TO ANY SUCH PROCEEDING.",
                    "label": 0},

            ], Languages.ENGLISH,
            {"category_id_to_info": {0: {"category_name": "cookies"}}})[0]

        while self.svm.get_model_status(model_id) != ModelStatus.READY:
            time.sleep(0.1)

        input_texts = [
            "This cookies policy was last updated on [1] June 2018 and is reviewed every 12 months.",
            "It also enables us to serve you advertising and other relevant content on and off of the Academia.edu Services.",
            "If you choose to decline cookies, some parts of the Airbnb Platform may not work as intended or may not work at all.",
            "Information about our use of cookies and how you can change your cookie settings can be found here.",
            "Get In Touch Chat with Sales Akamai will record this transcript.",
            "These Data Partners will provide us with additional information about you (such as your interests, preferences or demographic information)."
        ]
        preds = self.svm.infer_by_id(model_id, [{"text": text} for text in input_texts], use_cache=False)
        for pred in preds:
            self.assertIn(pred.label, [0, 2, 3])
            self.assertEqual(1, round(sum(pred.scores.values()), 5))

    def tearDown(self):
        self.temp_dir.cleanup()
