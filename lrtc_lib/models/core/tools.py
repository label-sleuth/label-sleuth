import logging
import re
import string

from collections import defaultdict
from enum import Enum

from lrtc_lib.models.core.languages import Languages


class RepresentationType(Enum):
    GLOVE = 1
    BOW = 2


BATCH_SIZE = 1000
spacy_models = defaultdict(lambda: None)
wnlp_models = defaultdict(lambda: None)


def get_glove_representation(sentences, language=Languages.ENGLISH):
    global spacy_model
    import spacy
    model_name = language.spacy_model_name
    if spacy_models[model_name] is None:
        logging.info(f"Loading spacy model {model_name} from disk")
        spacy_models[model_name] = spacy.load(model_name)

    spacy_model = spacy_models[model_name]
    sentences = remove_stop_words_and_punctuation(sentences, language=language)
    num_tokens_before = [len(sent.split()) for sent in sentences]
    # logging.info('removing out-of-vocabulary tokens')
    sentences = [' '.join(token for token in sent.split() if spacy_model.vocab.has_vector(token))
                 for sent in sentences]
    proportion_tokens_after = [len(sent.split())/prev_length for sent, prev_length in zip(sentences, num_tokens_before)
                               if prev_length > 0]
    # logging.info(f"number of tokens went down to {'{:.1%}'.format(sum(proportion_tokens_after)/len(sentences))}")

    # logging.info(f"Getting GloVe representations for {len(sentences)} sentences")
    embeddings = [spacy_model.make_doc(sent).vector for sent in sentences]

    logging.info(f"Done getting GloVe representations for {len(embeddings)} sentences")
    return embeddings


def remove_stop_words_and_punctuation(sentences, language=Languages.ENGLISH):
    # remove punctuation
    punctuation = string.punctuation + '•●'
    sentences = [t.translate(t.maketrans(punctuation, ' ' * len(punctuation))) for t in sentences]
    # remove stop words
    regex = r"\b(" + "|".join(language.stop_words) + r")\b"
    sentences = [re.sub(regex, r"", text) for text in sentences]
    # remove extra spaces
    sentences = [' '.join(sent.split()) for sent in sentences]
    return sentences


def remove_punctuation(sentences):
    punctuation = string.punctuation + '•●'
    sentences = [t.translate(t.maketrans(punctuation, ' ' * len(punctuation))) for t in sentences]
    return sentences







if __name__ == '__main__':
    texts = ["42 of the Italian Privacy Code, provided that personal data will be processed within the Countries reported in the Contract and inside the European Union or which implement an adequate protection of personal data in the judgment of the European Commission , ENEL - for itself and/or eventually also in the name and on behalf of other companies part the Enel group and Data Controller of their personal",
             "In the event that the Supplier intends to use for the execution of the contract third parties outside its organization (Subcontractors), and/or state that will process personal data in countries outside the European Union or in countries that do not implement an adequate protection of personal data in the judgment of the European Commission, the Supplier is required to provide to Enel of the names of such subcontractors and provided that the personal data will be processed in those countries specified in the Contract and outside the European Union or who have not had recognition of adequacy by the European Commission, , ENEL Italia SRL -for itself and/or eventually in the name and on behalf of Enel Group company Data Controller - in addition to the aappointment of the Supplier as Data Processor, pursuant to art.",
             "34.9 Without prejudice to the provisions of Clauses 34.2 to 34.8 inclusive, in the event of a Claim by an Indemnified Party in respect of Clause 34.1.5, prior to the Service Provider taking steps to recover sums from the recipient(s) of payments described in Clause 34.1.5, the Service Provider shall notify the BBC of the steps its proposes to take and where in the opinion of the Parties the BBC is likely to be able to assist in prompt recovery of such sums, the Service Provider shall delay the taking of its proposed recovery action to afford the BBC an reasonable opportunity (of not less than six (6) weeks) to recover the sums in question, or a material proportion thereof acceptable to the Service Provider as satisfactory recovery action (whereupon the Service Provider agrees not to take further action to recover any outstanding balance that otherwise would be due to the Service Provider).",
             '38.1 On the occurrence of a Step-In Trigger Event, the BBC may serve notice on the Service Provider (a "Step-In Notice" ) that it will be taking action under this Clause 38 ( Step-in Rights ), either itself or with the assistance of a third party (provided that the Service Provider may require any third parties to comply with a confidentiality undertaking equivalent to Clause 28 ( Confidentiality )).',
             " fddsfs ",
             "1.4.1. The Parties shall specify all measures required pursuant to Article 32 (Security of processing) of the GDPR in order to protect the security and confidentiality of BNP Paribas Personal Data processed by the Supplier, namely: taking into account the state of the art, the costs of implementation and the nature, scope, context and purposes of processing as well as the risk of varying likelihood and severity for the rights and freedoms of natural persons, each Party shall implement appropriate technical and organisational measures set forth in the Agreement to ensure a level of security appropriate to the risk for the Supplier's scope of responsibility.",
             "1.5.3. Where, in accordance with this Clause, the Supplier engages a Subprocessor for carrying out specific processing activities on behalf of BNP Paribas, the same data protection obligations as set out in the Agreement shall be imposed by the Supplier on that Subprocessor by way of a contract, in particular providing sufficient guarantees to implement appropriate technical and organisational measures in such a manner that the subprocessing will meet the requirements of the EU Data Protection Law.",
             "hello world", "hello  world", 'fmmrm',
             "28.1 Each of the Parties shall keep confidential and shall not disclose to any person the terms of this Contract and any information, whether in written or any other form, which has been or may be disclosed to it (\" Receiving Party \") or otherwise come into the possession of the Receiving Party by or on behalf of the other Party (\" Disclosing Party \") in the course of the discussions leading up to or the entering into or performance of this Contract and which is identified as confidential or is clearly by its nature confidential, including, without limitation, information relating to this Contract, the Services or the Charges, data used or generated in the provision of the Services, and any information disclosed in connection therewith, or any of the Disclosing Party's products, operations, processes, plans or intentions, know-how, trade secrets, market opportunities, customers and business affairs (\" Confidential Information \"), except insofar as such Confidential Information:",
             "24.1. All elements that a Party (Disclosing Party) makes available (verbally, in writing, in electronic format or in any other way) to the other Party (Receiving Party) for the purposes of and/or while performing the contract, as well as all documents, information, specific knowledge (irrespectively of how it has been collected, obtained or developed with regard to the contract) may only be used for the purposes of performing the contract itself and are confidential.",
             "4.1.1 Sharing and use of confidential information.",
             "5.1 Use of Confidential Information."
             ]
    reps = get_glove_representation(texts)

    from sklearn.neighbors import NearestNeighbors
    nbrs = NearestNeighbors(n_neighbors=2, algorithm='ball_tree').fit(reps)
    distances_to_closest_source, indices_of_closest_source = nbrs.kneighbors(reps)
    pairs = [(distances[1], texts[i], texts[idxs[1]]) for i, (idxs, distances) in enumerate(zip(indices_of_closest_source, distances_to_closest_source))]

    print('\n'.join([f'{pair}' for pair in pairs]))
