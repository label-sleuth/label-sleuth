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

import logging
import os
import pickle

from dataclasses import dataclass
from typing import Union

import numpy as np

import sklearn.svm
from sklearn.feature_extraction.text import CountVectorizer

from label_sleuth.models.core.languages import Language, Languages
from label_sleuth.models.core.model_api import ModelAPI, ModelStatus
from label_sleuth.models.core.prediction import Prediction, MulticlassPrediction
from label_sleuth.models.core.tools import RepresentationType, SentenceEmbeddingService
from label_sleuth.orchestrator.background_jobs_manager import BackgroundJobsManager

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s')


@dataclass
class SVMModelComponents:
    model: Union[sklearn.svm.LinearSVC, sklearn.svm.SVC]
    vectorizer: None
    language: Language
    additional_fields: dict


class SVM(ModelAPI):
    def __init__(self, output_dir, representation_type: RepresentationType,
                 background_jobs_manager: BackgroundJobsManager, sentence_embedding_service: SentenceEmbeddingService,
                 kernel="linear", is_multiclass=False):
        super().__init__(output_dir, background_jobs_manager, is_multiclass=is_multiclass)
        self.kernel = kernel
        self.representation_type = representation_type
        if self.representation_type in [RepresentationType.WORD_EMBEDDING, RepresentationType.SBERT]:
            self.sentence_embedding_service = sentence_embedding_service

    def _train(self, model_id, train_data, model_params):
        if self.kernel == "linear":
            model = sklearn.svm.LinearSVC(dual=True)
        elif self.kernel == "rbf":
            logging.warning("Using some arbitrary low gamma, gamma and C values might be better with tuning")
            model = sklearn.svm.SVC(gamma=1e-08)
        else:
            raise ValueError("Unknown kernel type")

        language = self.get_language(self.get_model_dir_by_id(model_id))
        texts = [x['text'] for x in train_data]
        train_data_features, vectorizer = self.input_to_features(texts, language=language,
                                                                 dataset_name=model_params.get('dataset_name'))
        labels = np.array([x['label'] for x in train_data])

        model.fit(train_data_features, labels)
        with open(os.path.join(self.get_model_dir_by_id(model_id), "vectorizer"), "wb") as fl:
            pickle.dump(vectorizer, fl)
        with open(os.path.join(self.get_model_dir_by_id(model_id), "model"), "wb") as fl:
            pickle.dump(model, fl)

        if self.representation_type == RepresentationType.WORD_EMBEDDING and language.spacy_model_name is not None:
            with open(os.path.join(self.get_model_dir_by_id(model_id), "spacy_version.txt"), "w") as fl:
                fl.write(self.sentence_embedding_service.get_spacy_model_version(language))

    def load_model(self, model_path) -> SVMModelComponents:
        with open(os.path.join(model_path, "model"), "rb") as fl:
            model = pickle.load(fl)
        with open(os.path.join(model_path, "vectorizer"), "rb") as fl:
            vectorizer = pickle.load(fl)
        language = self.get_language(model_path)
        dataset_name = self.get_metadata(model_path).get("dataset_name")
        additional_fields = {'dataset_name': dataset_name}
        if self.representation_type == RepresentationType.WORD_EMBEDDING and language.spacy_model_name is not None:
            spacy_version_file = os.path.join(model_path, "spacy_version.txt")
            if os.path.exists(spacy_version_file):
                with open(spacy_version_file) as f:
                    model_spacy_version = f.read()
            else:
                model_spacy_version = '3.2.0'
            additional_fields['spacy_version'] = model_spacy_version

        return SVMModelComponents(model=model, vectorizer=vectorizer, language=language,
                                  additional_fields=additional_fields)

    def infer(self, model_components: SVMModelComponents, items_to_infer):
        if 'spacy_version' in model_components.additional_fields:
            self.sentence_embedding_service.get_spacy_model(model_components.language.spacy_model_name)
            if self.sentence_embedding_service.get_spacy_model_version(model_components.language) \
                    != model_components.additional_fields['spacy_version']:
                raise Exception("This model is incompatible with the current version of Label Sleuth. To perform "
                                "inference using this model, please downgrade to version 0.14.0 or earlier.")

        features_all_texts, _ = self.input_to_features\
            ([x['text'] for x in items_to_infer],
           language=model_components.language,
           vectorizer=model_components.vectorizer,
           dataset_name=model_components.additional_fields.get('dataset_name'))
        labels = model_components.model.predict(features_all_texts).tolist()
        if self.is_multiclass:
            all_classes = model_components.model.classes_
            return [MulticlassPrediction(label=label, scores=dict(zip(all_classes, scores.tolist())))
                    for label, scores in zip(labels, self.get_probs(model_components.model, features_all_texts))]
        else:
            # The True label is in the second position as sorted([True, False]) is [False, True]
            scores = [probs[1] for probs in self.get_probs(model_components.model, features_all_texts)]
            return [Prediction(label=label, score=score) for label, score in zip(labels, scores)]

    @staticmethod
    def get_probs(model, features):
        distances = np.array(model.decision_function(features))  # get distances from hyperplanes (per class)
        if len(distances.shape) == 1:  # binary classification
            distances = distances / 2 + 0.5
            distances = np.expand_dims(distances, 1)
            distances = np.concatenate([1 - distances, distances], axis=1)
        # softmax to convert distances to probabilities
        prob = np.exp(distances) / np.sum(np.exp(distances), axis=1, keepdims=True)
        return prob

    def input_to_features(self, texts, language=Languages.ENGLISH, vectorizer=None,dataset_name=None):
        if self.representation_type == RepresentationType.BOW:
            if vectorizer is None:
                vectorizer = CountVectorizer(analyzer="word", tokenizer=None, preprocessor=None, stop_words=None,
                                             lowercase=True, max_features=10000)
                train_data_features = vectorizer.fit_transform(texts)
                return train_data_features, vectorizer
            else:
                return vectorizer.transform(texts), None
        elif self.representation_type in [RepresentationType.WORD_EMBEDDING, RepresentationType.SBERT]:
            return self.sentence_embedding_service.\
                       get_sentence_embeddings_representation(texts,
                                                              language=language,
                                                              representation_type=self.representation_type,
                                                              dataset_name=dataset_name), None

    def get_model_dir_name(self):  # for backward compatibility, we override the default get_model_dir_name()
        return "svm"


class SVM_BOW(SVM):
    def __init__(self, output_dir, background_jobs_manager, sentence_embedding_service):
        super().__init__(output_dir=output_dir, background_jobs_manager=background_jobs_manager,
                         representation_type=RepresentationType.BOW,
                         sentence_embedding_service=sentence_embedding_service)

    def get_supported_languages(self):
        return Languages.all_languages()


class MulticlassSVM_BOW(SVM):
    def __init__(self, output_dir, background_jobs_manager, sentence_embedding_service):
        super().__init__(output_dir=output_dir, background_jobs_manager=background_jobs_manager,
                         representation_type=RepresentationType.BOW,
                         sentence_embedding_service=sentence_embedding_service, is_multiclass=True)

    def get_supported_languages(self):
        return Languages.all_languages()


class SVM_WordEmbeddings(SVM):
    def __init__(self, output_dir, background_jobs_manager, sentence_embedding_service):
        super().__init__(output_dir=output_dir, background_jobs_manager=background_jobs_manager,
                         representation_type=RepresentationType.WORD_EMBEDDING,
                         sentence_embedding_service=sentence_embedding_service)

    def get_supported_languages(self):
        return Languages.all_languages()

class SVM_Sbert(SVM):
    def __init__(self, output_dir, background_jobs_manager, sentence_embedding_service):
        super().__init__(output_dir=output_dir, background_jobs_manager=background_jobs_manager,
                         representation_type=RepresentationType.SBERT,
                         sentence_embedding_service=sentence_embedding_service)

    def get_supported_languages(self):
        return {Languages.ENGLISH}

class MulticlassSVM_WordEmbeddings(SVM):
    def __init__(self, output_dir, background_jobs_manager, sentence_embedding_service):
        super().__init__(output_dir=output_dir, background_jobs_manager=background_jobs_manager,
                         representation_type=RepresentationType.WORD_EMBEDDING,
                         sentence_embedding_service=sentence_embedding_service,
                         is_multiclass=True)

    def get_supported_languages(self):
        return Languages.all_languages()


if __name__ == '__main__':
    api = MulticlassSVM_WordEmbeddings("/tmp", BackgroundJobsManager(), SentenceEmbeddingService("../output"))
    model_id = api.train(
        [
            {
                "text": "If you choose to decline cookies, some parts of the Airbnb Platform may not work as intended or may not work at all.",
                "label": 2},
            {
                "text": "As a condition to using Services, you are required to open an account with 500px and select a password and username, and to provide registration information.The registration information you provide must be accurate, complete, and current at all times.",
                "label": 0},
            {
                "text": "§ You must opt-out separately from each computer or device and browser that you use to access our Sites and if you clear your cookies, you will need to repeat the opt-out process.",
                "label": 1},
            {
                "text": "Please note that if you request the erasure of your personal information: We may retain some of your personal information as necessary for our legitimate business interests, such as fraud detection and prevention and enhancing safety.For example, if we suspend an Airbnb Account for fraud or safety reasons, we may retain certain information from that Airbnb Account to prevent that Member from opening a new Airbnb Account in the future.We may retain and use your personal information to the extent necessary to comply with our legal obligations.For example, Airbnb and Airbnb Payments may keep some of your information for tax, legal reporting and auditing obligations.<",
                "label": 0},
            {
                "text": "Additionally, Microsoft partners with third-party ad companies to help provide some of our advertising services, and we also allow other third-party ad companies to display advertisements on our sites.These third parties may place cookies on your computer and collect data about your online activities across websites or online services.",
                "label": 1},
            {
                "text": "By posting Visual Content to the Site, you grant to 500px a non-exclusive or exclusive, transferable, fully paid, worldwide license to use, sublicense, distribute, reproduce, modify, adapt, publicly perform and publicly display such Visual Content in connection with the Services.This license will exist for the period during which the Visual Content is posted on the Site and will automatically terminate upon the removal of the Visual Content from the Site, subject to the terms of any license granted by an authorized 500px distributor;The license granted to 500px includes the right to use Visual Content fully or partially for promotional reasons and to distribute and redistribute Visual Content to other parties, websites, authorized agents, applications, and other entities, provided such Visual Content is attributed in accordance with the required credits (i.e.username or collection name, profile picture, photo title, descriptions, tags, and other accompanying information) if any and as appropriate, as submitted to 500px, subject to any credit requirements governing the licensing of Visual Content pursuant to the Contributor Agreement (notwithstanding the foregoing, no inadvertent failure to provide appropriate attribution shall be considered a breach of these Terms);500px and its distributors have the right to modify, alter and amend photo titles, descriptions, tags, metadata and other accompanying information for any Visual Content and the right to submit Visual Content to other parties and authorized agents for the purpose of creating tags for Visual Content;",
                "label": 0},
            {
                "text": "Other Data Partners use cookies and other tracking technologies to enable the delivery of interest-based advertising to users.",
                "label": 1},
            {
                "text": "500px reserves the right, at its sole discretion, to modify or replace the Terms at any time.If the alterations constitute a material change to the Terms, 500px will notify you by posting an announcement on the Site.What constitutes a material change will be determined at 500px’s sole discretion.You are responsible for reviewing and becoming familiar with any such modifications.Using any Service or viewing any Visual Content constitutes your acceptance of the Terms as modified.",
                "label": 0},
            {
                "text": "Third-parties who provide us with products and services may also place cookies, ad tags and/or beacons that collect the information outlined above in order to provide us with products and services including: Analytics tools (e. g. , Google Analytics) allowing us to analyze the performance of our Services.",
                "label": 1},
            {
                "text": "It also enables us to serve you advertising and other relevant content on and off of the Academia.edu Services.",
                "label": 0},
            {
                "text": "Information about our use of cookies and how you can change your cookie settings can be found here.",
                "label": 1},
            {
                "text": "If Airbnb undertakes or is involved in any merger, acquisition, reorganization, sale of assets, bankruptcy, or insolvency event, then we may sell, transfer or share some or all of our assets, including your information",
                "label": 0},
            {
                "text": "We use cookies and other similar technologies, such as web beacons, pixels, and mobile identifiers.",
                "label": 1},
            {"text": "a binding arbitration administered by the American Arbitration Association (“AAA”)", "label": 0},
            {
                "text": "We may also use third party cookies for the purposes of web analytics, attribution and error management.",
                "label": 1},
            {
                "text": "YOU AND 500PX AGREE THAT ANY PROCEEDINGS TO RESOLVE OR LITIGATE ANY DISPUTE ARISING HEREUNDER WILL BE CONDUCTED SOLELY ON AN INDIVIDUAL BASIS, AND THAT YOU WILL NOT SEEK TO HAVE ANY DISPUTE HEARD AS A CLASS ACTION, A REPRESENTATIVE ACTION, A COLLECTIVE ACTION, A PRIVATE ATTORNEY-GENERAL ACTION, OR IN ANY PROCEEDING IN WHICH YOU ACT OR PROPOSE TO ACT IN A REPRESENTATIVE CAPACITY.YOU FURTHER AGREE THAT NO PROCEEDING WILL BE JOINED, CONSOLIDATED, OR COMBINED WITH ANOTHER PROCEEDING WITHOUT THE PRIOR WRITTEN CONSENT OF 500PX AND ALL PARTIES TO ANY SUCH PROCEEDING.",
                "label": 0},

        ], Languages.ENGLISH,
        {"category_id_to_info": {0: {"category_name": "cookies"}}})[0]
    while api.get_model_status(model_id) != ModelStatus.READY:
        import time

        time.sleep(1)
        logging.info(f"waiting for model id {model_id}")
    input_texts = [
        # 'Like many websites, we use "cookies" and "web beacons" to collect information.',
        #          "Access to web search results or other general content on our Sites does not require you to provide us any personal (e. g. , name, date of birth), contact (e. g. , email address, phone number) and/or account (username and password) information.",
        #         "You will continue to see advertisements on our Sites.",
        "This cookies policy was last updated on [1] June 2018 and is reviewed every 12 months.",
        "It also enables us to serve you advertising and other relevant content on and off of the Academia.edu Services.",
        "If you choose to decline cookies, some parts of the Airbnb Platform may not work as intended or may not work at all.",
        "Information about our use of cookies and how you can change your cookie settings can be found here.",
        "Get In Touch Chat with Sales Akamai will record this transcript.",
        "These Data Partners will provide us with additional information about you (such as your interests, preferences or demographic information)."
    ]
    preds = api.infer_by_id(model_id, [{"text": text} for text in input_texts], use_cache=False)
    for text, preds in zip(input_texts, preds):
        logging.info(f"{text}\n{preds}")
        logging.info("***")
