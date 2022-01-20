import logging

from lrtc_lib.models.core.model_api import ModelStatus

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s')
import getpass
import os

from io import StringIO
import pandas as pd
import tempfile
import traceback
from concurrent.futures.thread import ThreadPoolExecutor

from flask import Flask, jsonify, request, send_file, make_response
from flask_cors import CORS, cross_origin
from flask_httpauth import HTTPTokenAuth

from lrtc_lib.orchestrator import orchestrator_api


from lrtc_lib import definitions
from lrtc_lib.async_support.orchestrator_background_jobs_manager import \
    start_orchestrator_background_job_manager
import lrtc_lib.core.backend as orch
from lrtc_lib.core.information_gain_utils import information_gain
from lrtc_lib.config import CONFIGURATION
from lrtc_lib.configurations.users import users, tokens
from lrtc_lib.data_access.core.data_structs import LABEL_POSITIVE, LABEL_NEGATIVE
from lrtc_lib.data_access.data_access_api import AlreadyExistException

print("user:")
print(getpass.getuser())
executor = ThreadPoolExecutor(20)


def init_properties():
    definitions.PROJECT_PROPERTIES["model_policy"] = CONFIGURATION.model_policy.value
    definitions.PROJECT_PROPERTIES["training_set_selection"] = CONFIGURATION.training_set_selection_strategy
    orch.set_active_learning_strategy(CONFIGURATION.active_learning_strategy)

    definitions.ASYNC = True  # Always async in the UI
    start_orchestrator_background_job_manager(orchestrator_api._update_recommendation,
                                              orch._post_train_method,
                                              orch._post_active_learning_func)
    definitions.LOCAL_FINETUNE = CONFIGURATION.local_finetune


init_properties()
app = Flask(__name__)
auth = HTTPTokenAuth(scheme='Bearer')

cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'


## move to common :

def elements_back_to_front(workspace_id, elt_array, category):
    res = []
    elements_res = {}
    e_res = {}

    for e in elt_array:
        e_res['id'] = e.uri
        e_res['docid'] = _get_document_id(e.uri)
        e_res['begin'] = e.span[0][0]
        e_res['end'] = e.span[0][1]
        e_res['text'] = str(e.metadata)[1:-1] if CONFIGURATION.show_translation else e.text
        # e_res['latest_user_action'] = {'category_name':'', 'value':''}

        e_res['user_labels'] = {}
        for key, value in e.category_to_label.items():
            if len(value.labels) > 1:
                raise Exception("no multilabel support by the UI")
            e_res['user_labels'][key] = str(next(iter(value.labels))).lower()  # current UI is using true and false as strings. change to boolean in the new UI

        e_res['model_predictions'] = {}

        elements_res[e_res['id']] = e_res
        e_res = {}

    if category:

        rec = orch.get_recommended_action(workspace_id, category)[0].name

        # print(rec)

        if rec == 'LABEL_BY_MODEL':
            if len(elt_array) == 0:
                logging.info("no elements to infer")
            else:
                predicted_label = orch.infer(workspace_id, category, elt_array)["labels"]

                for text_element, prediction in zip(elt_array, predicted_label):
                    elements_res[text_element.uri]['model_predictions'][category] = str(prediction).lower() # since the current expects string labels and not boolean

        # if(rec == 'LABEL_BY_QUERY'):
        #     print("LABEL_BY_QUERY")
    else:
        logging.warning("skipping category!")

    # return an array of elements
    for key, value in elements_res.items():
        res.append(value)

    return res




def updateElementByUser(workspace_id, eltid, category_name, value, update_counter=True):
    if value != 'none':
        if value in ['true', "True", "TRUE", True]:
            value = True
        elif value in ['false', "False", "FALSE", False]:
            value = False
        else:
            raise Exception (f"cannot convert label to boolean. Input label = {value}")

    uri_with_updated_label = [(eltid, {category_name: orch.Label(value, {})})]

    # add unset here if repeating the selection
    if value == 'none':
        orch.unset_labels(workspace_id, category_name, [eltid])
    else:
        orch.set_labels(workspace_id, uri_with_updated_label, update_label_counter=update_counter)

    return getElement(workspace_id, eltid)


def _get_dataset_name(workspace_id):
    workspace_info = orch.get_workspace_info(workspace_id)
    return workspace_info['dataset_name']


def getElement(workspace_id, eltid):
    """
    get element
    :param workspace_id:
    :param elt_id:
    :return element:
    """
    dataset_name = _get_dataset_name(workspace_id)
    element = orch.get_text_elements(workspace_id, dataset_name, [eltid])
    category_name = request.args.get('category_name')
    element_transformed = elements_back_to_front(workspace_id, element, category_name)
    return element_transformed[0]


## end of move to common


def _build_cors_preflight_response():
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "*")
    response.headers.add("Access-Control-Allow-Methods", "*")
    return response



def authenticate_response(user):
    return make_response(jsonify(user), 200)


def verify_password(username, password):
    if username in users:
        user = users[username]
        return user and user.password == password
    else:
        return False

@auth.verify_token
def verify_token(token):
    if not token:
        return False
    return token in tokens

def _get_document_id(element_id):
    idx = element_id.rfind('-')
    return element_id[0:idx]
@app.route('/users/authenticate', methods=['POST'])
def login():
    post_data = request.get_json(force=True)
    username = post_data["username"]
    password = post_data["password"]

    if not verify_password(username, password):
        logging.warning(f"LOGIN FAILED: {username} {password}")
        return make_response(jsonify({
            'error': "wrong user or password"
        }), 401)
    else:
        user = users.get(username)
        logging.info(f"LOGIN: {user.username}")
        return authenticate_response({
            'username': user.username,
            'token': user.token
        })


@app.route("/datasets", methods=['GET'])
@auth.login_required
def get_all_dataset_ids():
    """
    Get all existing datasets
    :return array of dataset ids as strings:
    """
    all_datasets = orch.get_all_datasets()
    res = {'datasets':
               [{"dataset_id": d} for d in sorted(all_datasets)]}
    return jsonify(res)


@app.route('/datasets/<dataset_name>/add_documents', methods=['POST'])
@cross_origin()
@auth.login_required
def add_documents(dataset_name):
    temp_dir = None
    try:
        csv_data = StringIO(request.files['file'].stream.read().decode("utf-8"))
        df = pd.read_csv(csv_data)
        temp_dir = os.path.join(definitions.ROOT_DIR,"output","temp","csv_upload")
        temp_file_name = f"{next(tempfile._get_candidate_names())}.csv"
        os.makedirs(temp_dir,exist_ok=True)
        df.to_csv(os.path.join(temp_dir,temp_file_name))
        loaded, workspaces_to_update = orch.add_documents_from_file(dataset_name,temp_file_name)

        return jsonify({"dataset_name":dataset_name,
                        "num_docs":len(loaded),
                        "num_sentences":sum(len(doc.text_elements) for doc in loaded),
                        "workspaces_to_update":workspaces_to_update})
    except AlreadyExistException as e:
        return jsonify({"dataset_name":dataset_name, "error": "documents already exists", "documents":e.documents, "error_code":409})
    except Exception:
        logging.exception(f"failed to load or add documents to dataset {dataset_name}")
        return jsonify({"dataset_name":dataset_name, "error": traceback.format_exc(),"error_code":400})
    finally:
        if temp_dir is not None and os.path.exists(os.path.join(temp_dir,temp_file_name)):
            os.remove(os.path.join(temp_dir,temp_file_name))

@app.route("/workspace", methods=['POST'])
@auth.login_required
def create_workspace():
    """
    Create workspace
    :param workspace_id
    :param dataset_name
    :return workspace_id, dataset_name:
    """
    post_data = request.get_json(force=True)
    workspace_id = post_data["workspace_id"]
    dataset_name = post_data["dataset_id"]

    if orch.workspace_exists(workspace_id):
        raise Exception(f"workspace {workspace_id} already exists")
    orch.create_workspace(workspace_id=workspace_id, dataset_name=dataset_name)

    all_document_ids = orch.get_all_document_uris(workspace_id)
    first_document_id = all_document_ids[0]

    res = {'workspace': {'workspace_id': workspace_id,
                         'dataset_name': dataset_name,
                         'first_document_id': first_document_id}}

    return jsonify(res)


# Get all
@app.route("/workspaces", methods=['GET'])
@auth.login_required
def get_all_workspace_ids():
    """
    Get all existing workspaces
    :return array of workspace ids as strings:
    """
    res = {'workspaces': orch.list_workspaces()}
    return jsonify(res)

@app.route("/workspace/<workspace_id>", methods=['DELETE'])
@auth.login_required
def delete_workspace(workspace_id):
    """
    Delete Workspace
    :param <workspace_id>
    :return success
    """
    orch.delete_workspace(workspace_id)
    return jsonify({'workspace_id': workspace_id})

# Get Single
@app.route("/workspace/<workspace_id>", methods=['GET'])
@auth.login_required
def get_workspace_info(workspace_id):
    """
    Get workspace info
    :param workspace_id
    :return workspace_id, dataset_name, array of all document_ids, id of first document:
    """
    workspace_info = orch.get_workspace_info(workspace_id)
    document_ids = orch.get_all_document_uris(workspace_id)
    first_document_id = document_ids[0]

    res = {'workspace': {'workspace_id': workspace_info['workspace_id'],
                         'dataset_name': workspace_info['dataset_name'],
                         'first_document_id': first_document_id,
                         'document_ids': document_ids}}
    return jsonify(res)


###########################
#     Documents
##########################

# get all documents given workspace
@app.route("/workspace/<workspace_id>/documents", methods=['GET'])
@auth.login_required
def get_all_document_uris(workspace_id):
    """
    get all Documents
    :param workspace_id:
    :return documents:
    """

    doc_uris = orch.get_all_document_uris(workspace_id)
    res = {"documents":
               [{"document_id": uri} for uri in doc_uris]} # TODO change document_id to document_uri in the ui
    return jsonify(res)


@app.route("/workspace/<workspace_id>/document/<document_id>", methods=['GET'])
@auth.login_required
def get_document_elements(workspace_id, document_id):
    """
    get all elements in a document
    :param workspace_id:
    :param document_id: the uri of the document
    :return elements:
    """
    dataset_name = _get_dataset_name(workspace_id)
    document = orch.get_documents(workspace_id, dataset_name, [document_id])[0]
    elements = document.text_elements

    category = None
    if request.args.get('category_name'):
        category = request.args.get('category_name')
    elements_transformed = elements_back_to_front(workspace_id, elements, category)

    res = {'elements': elements_transformed}
    return jsonify(res)


@app.route("/workspace/<workspace_id>/positive_elements", methods=['GET'])
@auth.login_required
def get_all_positive_labeled_elements_for_category(workspace_id):
    category = request.args.get('category_name')
    elements = \
        orch.get_all_labeled_text_elements(workspace_id, _get_dataset_name(workspace_id), category)["results"]
    elements_transformed = elements_back_to_front(workspace_id, elements, category)

    res = {'positive_elements':
               [element for element in elements_transformed
                if category in element['user_labels'] and element['user_labels'][category] == LABEL_POSITIVE]}
    return jsonify(res)


@app.route("/workspace/<workspace_id>/disagree_elements", methods=['GET'])
@auth.login_required
def get_label_and_model_disagreements(workspace_id):
    category = request.args.get('category_name')
    elements = \
        orch.get_all_labeled_text_elements(workspace_id, _get_dataset_name(workspace_id), category)["results"]
    elements_transformed = elements_back_to_front(workspace_id, elements, category)

    res = {'disagree_elements':
               [element for element in elements_transformed
                if category in element['model_predictions'] and category in element['user_labels']
                and element['model_predictions'][category] != element['user_labels'][category]]}
    return jsonify(res)


@app.route("/workspace/<workspace_id>/labeled_info_gain", methods=['GET'])
@auth.login_required
def get_labeled_elements_enriched_tokens(workspace_id):
    category = request.args.get('category_name')
    elements = \
        orch.get_all_labeled_text_elements(workspace_id, _get_dataset_name(workspace_id), category)["results"]
    elements_transformed = elements_back_to_front(workspace_id, elements, category)
    res = dict()
    if elements:
        boolean_labels = [category in element['user_labels'] and element['user_labels'][category] == LABEL_POSITIVE
                          for element in elements_transformed]
        res['info_gain'] = information_gain(elements, boolean_labels)
    return jsonify(res)



@app.route("/workspace/<workspace_id>/document/<document_id>/predictions", methods=['GET'])
@auth.login_required
def get_document_predictions(workspace_id, document_id):
    """
    get all elements in a document
    :param workspace_id:
    :param document_id:
    :param category_name:
    :return elements filtered by whether in this document and the selected category, the prediction is positive:
    """
    size = int(request.args.get('size', 100))
    start_idx = int(request.args.get('start_idx', 0))

    category_name = request.args.get('category_name')

    dataset_name = _get_dataset_name(workspace_id)

    document = orch.get_documents(workspace_id, dataset_name, [document_id])[0]

    elements = document.text_elements

    elements_transformed = elements_back_to_front(workspace_id, elements, category_name)

    model_predictions_first = \
        elements_transformed[0]['model_predictions']  # check if this category has been predicted yet

    if category_name in model_predictions_first.keys():
        elements_transformed_predictions = \
            list(filter(
                lambda element: element['model_predictions'][category_name] == LABEL_POSITIVE,
                elements_transformed))
        elements_transformed_predictions = elements_transformed_predictions[start_idx: start_idx + size]

    else:
        elements_transformed_predictions = []

    res = {'elements': elements_transformed_predictions}
    return jsonify(res)


###########################
#     Element
##########################

@app.route("/workspace/<workspace_id>/query", methods=['GET'])
@auth.login_required
def query(workspace_id):
    """
    get elements that match query string
    :param workspace_id:
    :param qry_string:
    :param category_name:
    :param qry_size: how many elements to return
    :param sample_start_idx: get the results from this sample_start_idx element (for paging)
    :return elements:
    """

    query_string = request.args.get('qry_string')
    sample_size = int(request.args.get('qry_size', 100))
    sample_start_idx = int(request.args.get('sample_start_idx', 0))
    category_name = request.args.get('category_name')

    resp = orch.query(workspace_id, _get_dataset_name(workspace_id), category_name, query_string,
                      unlabeled_only=False,
                      sample_size=sample_size, sample_start_idx=sample_start_idx,
                      remove_duplicates=True)
    elements = resp[
        "results"]  # TODO we might want to pass unlabeled_only=True / let the user decide

    elements_transformed = elements_back_to_front(workspace_id, elements, category_name)

    res = dict()
    res['elements'] = sorted(elements_transformed, key=lambda e: e['docid'])
    res['hit_count'] = resp["hit_count"]
    res['hit_count_unique'] = resp["hit_count_unique"]
    return jsonify(res)


@app.route("/workspace/<workspace_id>/active_learning", methods=['GET'])
@auth.login_required
def get_elements_to_label(workspace_id):
    """
    get elements that AL strategy wants labeled
    :param workspace_id:
    :param qry_string:
    :param category_name:
    :return elements IN ORDER:
    :currently hardcoding ActiveLearningStrategies.RANDOM:
    """

    category_name = request.args.get('category_name')
    size = int(request.args.get('size', 100))
    start_idx = int(request.args.get('start_idx', 0))

    if len(orch.get_all_models_for_category(workspace_id, category_name)) == 0:
        return jsonify({"elements": []})

    elements = orch.get_elements_to_label(workspace_id, category_name, size, start_idx)
    elements_transformed = elements_back_to_front(workspace_id, elements, category_name)

    res = {'elements': elements_transformed}
    return jsonify(res)


@app.route("/workspace/<workspace_id>/element/<eltid>", methods=['GET'])
@auth.login_required
def get_element_by_id(workspace_id, eltid):
    return getElement(workspace_id, eltid)


@app.route('/workspace/<workspace_id>/element/<eltid>', methods=['PUT'])
@auth.login_required
def set_element_label(workspace_id, eltid):
    """
    update element
    :param workspace_id:
    :param elt_id:
    :param category_name:
    :param value:
    :param update_counter:
    :return success:
    """
    post_data = request.get_json(force=True)

    category_name = post_data["category_name"]
    value = post_data["value"]
    update_counter = post_data.get('update_counter', True)

    element = updateElementByUser(workspace_id, eltid, category_name, value, update_counter)
    res = {'element': element, 'workspace_id': workspace_id, 'category_name': category_name}
    return jsonify(res)



@app.route("/workspace/<workspace_id>/categories", methods=['GET'])
@auth.login_required
def get_all_categories(workspace_id):
    """
    :param workspace_id:
    Get current state of classes
    :return classes:
    """
    categories = orch.get_all_categories(workspace_id)
    category_dicts = [{'id': name, 'className': name, 'classDescription': description}
                      for name, description in categories.items()]

    res = {'categories': category_dicts}
    return jsonify(res)


@app.route("/workspace/<workspace_id>/category/<category_name>", methods=['POST'])
@auth.login_required
def add_category(workspace_id, category_name):
    """
    add a new category
    :param workspace_id:
    :param category_name:
    :param className:
    :param classDescription:
    :return success:
    """
    post_data = request.get_json(force=True)
    post_data['id'] = category_name
    orch.create_new_category(workspace_id, post_data["className"], post_data["classDescription"])

    res = {'category': post_data}
    return jsonify(res)

@app.route("/workspace/<workspace_id>/category/<category_name>", methods=['PUT'])
@auth.login_required
def rename_category(workspace_id, category_name):
    """
    edit category - TODO, will need to change the backend function
    :param workspace_id:
    :param category_name:
    :param className:
    :param classDescription:
    :return success:
    """

    return "Not Implemented", 503


@app.route("/workspace/<workspace_id>/category/<category_name>", methods=['DELETE'])
@auth.login_required
def delete_category(workspace_id, category_name):
    """
    :param workspace_id:
    :param category_name:
    :return success:
    """
    orch.delete_category(workspace_id, category_name)


###########################
#     Model Status
##########################

@app.route("/workspace/<workspace_id>/status", methods=['GET'])
@auth.login_required
def get_labelling_status(workspace_id):
    """
    :param workspace_id:
    :param category_name:
    :return empty string or model id:
    """

    category_name = request.args.get('category_name')
    # print(category_name)
    dataset_name = _get_dataset_name(workspace_id)
    #rec = orch.train_if_recommended(workspace_id, category_name)
    future = executor.submit(orch.train_if_recommended, workspace_id, category_name)

    # print(rec)
    labeling_counts = orch.get_label_counts(workspace_id, dataset_name, category_name)
    progress = orch.get_progress(workspace_id, dataset_name, category_name)


    return jsonify({
        "labeling_counts": labeling_counts,
        "progress": progress,
        "notifications": [] # TODO remove from UI
    })


@app.route("/workspace/<workspace_id>/force_train", methods=['GET'])
@auth.login_required
def force_train_for_category(workspace_id):
    """
    :param workspace_id:
    :param category_name:
    :return empty string or model id:
    """

    category_name = request.args.get('category_name')
    # print(category_name)
    dataset_name = _get_dataset_name(workspace_id)
    #rec = orch.train_if_recommended(workspace_id, category_name)
    if category_name not in orch.get_all_categories(workspace_id):
        return jsonify({
            "error": "no such category '"+(category_name if category_name else "<category not provided in category_name param>")+"'"
        })
    model_id = orch.train_if_recommended(workspace_id, category_name,force=True)

    # print(rec)
    labeling_counts = orch.get_label_counts(workspace_id, dataset_name, category_name)
    logging.info(f"force training  a new model in workspace {workspace_id} in category {category_name}, policy id {model_id}")

    return jsonify({
        "labeling_counts": labeling_counts,
        "model_id": model_id
    })


def extract_model_information_list(workspace_id, models):
    res_list = \
        [{'model_id': model.model_id,
          'model_status': model.model_status.name,
          'creation_epoch': model.creation_date.timestamp(),
          'model_type': model.model_type.name,
          # The current UI expects a dict of string to int, and train counts contains a mix of boolean and string keys.
          'model_metadata': {**model.model_metadata,"train_counts":{str(k).lower():v for k,v in model.model_metadata["train_counts"].items()}},
          'active_learning_status':
              orchestrator_api.get_model_active_learning_status(workspace_id, model.model_id).name}
        for model in models]

    res_sorted = [{**model_dict, 'iteration': i} for i, model_dict in enumerate(
        sorted(res_list, key=lambda item: item['creation_epoch']))]

    return res_sorted


@app.route("/workspace/<workspace_id>/models", methods=['GET'])
@auth.login_required
@cross_origin()
def get_all_models_for_category(workspace_id):
    """
    :param workspace_id:
    :param category_name:
    :return array of all models sorted from oldest to newest:
    """

    category_name = request.args.get('category_name')

    res = dict()

    if category_name == 'all':
        models = orch.get_all_models(workspace_id).values()
        res['models'] = extract_model_information_list(workspace_id, models)
    elif category_name == 'none':
        res['models'] = []
    else:
        models = orch.get_all_models_for_category(workspace_id, category_name).values()
        res['models'] = extract_model_information_list(workspace_id, models)
    return jsonify(res)


@app.route("/workspace/<workspace_id>/predictions_info_gain", methods=['GET'])
@auth.login_required
@cross_origin()
def get_predictions_enriched_tokens(workspace_id):
    """
    :param workspace_id:
    :param category_name:
    :return info-gain of a predictions sample
    """
    res = dict()
    category = request.args.get('category_name')
    models = orch.get_all_models_for_category(workspace_id, category)
    if len(models) == 0:
        res['info_gain'] = []
        return jsonify(res)

    true_elements = orch.sample_elements_by_prediction(workspace_id, category, 1000, unlabeled_only=True,
                                                  required_label=LABEL_POSITIVE)
    false_elements = orch.sample_elements_by_prediction(workspace_id, category, 1000, unlabeled_only=True,
                                                   required_label=LABEL_NEGATIVE)

    elements = true_elements + false_elements
    targets = [1] * len(true_elements) + [0] * len(false_elements)

    res['info_gain'] = information_gain(elements, targets)
    return jsonify(res)


###########################
#     Exams
##########################


@app.route("/workspace/<workspace_id>/evaluation_elements", methods=['GET'])
@auth.login_required
def get_elements_for_precision_evaluation(workspace_id):
    size = CONFIGURATION.precision_evaluation_size
    category = request.args.get('category_name')
    random_state = len(orch.get_all_models_by_state(workspace_id, category, ModelStatus.READY))
    all_elements = orchestrator_api.get_all_text_elements(_get_dataset_name(workspace_id))
    if CONFIGURATION.precision_evaluation_filter:
        before_size = len(all_elements)
        all_elements = [x for x in all_elements if CONFIGURATION.precision_evaluation_filter in x.uri]
        logging.info(
            f"Precision evaluation uri filter {CONFIGURATION.precision_evaluation_filter} applied. num elements changed from {before_size} to {len(all_elements)}")
    sample_elements_predictions = orch.infer(workspace_id, category, all_elements)["labels"]
    prediction_sample = \
        [text_element for text_element, prediction in zip(all_elements, sample_elements_predictions) if
         prediction == LABEL_POSITIVE]
    logging.info(f"Precision evaluation {len(prediction_sample)} left after removing negative predictions")
    import random
    random.Random(random_state).shuffle(prediction_sample)
    prediction_sample = prediction_sample[0:size]
    res = dict()
    elements_transformed = elements_back_to_front(workspace_id,
                                                  prediction_sample,
                                                  category)
    res['elements'] = elements_transformed
    logging.info(f"sampled {len(elements_transformed)} elements for evaluation")
    return jsonify(res)


@app.route('/workspace/<workspace_id>/estimate_precision', methods=['POST'])
@auth.login_required
@cross_origin()
def run_precision_evaluation(workspace_id):
    """
    update element
    :param workspace_id:
    :param category_name:
    :param exams:
    :return success:
    """
    category_name = request.args.get('category_name')
    post_data = request.get_json(force=True)
    ids = post_data["ids"]
    changed_elements_count = post_data["changed_elements_count"]
    model_id = post_data["model_id"]
    score = orch.estimate_precision(workspace_id, category_name, ids, changed_elements_count, model_id)
    res = {'score': score}
    return jsonify(res)

@app.route("/workspace/<workspace_id>/suspicious_elements", methods=['GET'])
@auth.login_required
def get_suspicious_elements(workspace_id):
    category = request.args.get('category_name')
    try:
        suspicious_elements = orch.get_suspicious_report(workspace_id, category)
        elements_transformed = elements_back_to_front(workspace_id, suspicious_elements, category)
        res = {'elements': elements_transformed}
        return jsonify(res)
    except Exception:
        logging.exception("Failed to generate suspicious elements repot")
        res = {'elements': []}
        return jsonify(res)


@app.route("/workspace/<workspace_id>/contradiction_elements", methods=['GET'])
@auth.login_required
def get_contradicting_elements(workspace_id):
    category = request.args.get('category_name')
    try:
        contradiction_element_tuples = orch.get_contradictions_report_with_diffs(workspace_id,
                                                                                 category)
        elements_transformed = [elements_back_to_front(workspace_id, [tuple[0], tuple[2]], category)
                                for tuple in contradiction_element_tuples]
        diffs = [[list(tuple[1]), list(tuple[3])] for tuple in contradiction_element_tuples]
        res = {'pairs': elements_transformed, 'diffs': diffs}
        return jsonify(res)
    except Exception:
        logging.exception("Failed to generate contradiction report")
        res = {'pairs': []}
        return jsonify(res)



###########################
#     export / import
##########################

@app.route('/workspace/<workspace_id>/export_labels', methods=['GET'])
@auth.login_required
def export_labels(workspace_id):
    return orch.export_workspace_labels(workspace_id).to_csv(index=False)


@app.route('/workspace/<workspace_id>/export_predictions', methods=['GET'])
@auth.login_required
def export_predictions(workspace_id):
    category_name = request.args.get('category_name')
    filter = request.args.get('uri_filter', None)
    model_id = request.args.get('model_id')
    elements = orch.get_all_text_elements(_get_dataset_name(workspace_id))
    if filter:
        elements = [x for x in elements if filter in x.uri]
    infer_results = orch.infer(workspace_id, category_name, elements,
                                           model_id=model_id)
    return pd.DataFrame([{**o.__dict__, "score": scores[1], 'predicted_label': labels} for o, scores, labels in
                       zip(elements, infer_results["scores"], infer_results["labels"])]).to_csv(index=False)

@app.route('/workspace/<workspace_id>/import_labels', methods=['POST'])
@cross_origin()
@auth.login_required
def import_labels(workspace_id):
    from io import StringIO
    import pandas as pd
    csv_data = StringIO(request.data.decode("utf-8"))
    df = pd.read_csv(csv_data, dtype={'labels': str})
    return jsonify(orch.import_category_labels(workspace_id, df))


@app.route('/workspace/<workspace_id>/export_model', methods=['GET'])
@auth.login_required
def export_model(workspace_id):
    import zipfile
    from io import BytesIO
    category_name = request.args.get('category_name')
    model_id = request.args.get('model_id', None)
    if model_id is None:
        category_models = orch.get_all_models_by_state(workspace_id, category_name, ModelStatus.READY)
        model_id = category_models[-1].model_id
    model_dir = orch.export_model(workspace_id, model_id)
    memory_file = BytesIO()
    with zipfile.ZipFile(memory_file, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
        for dirpath, dirnames, filenames in os.walk(model_dir):
            for filename in filenames:
                file_path = os.path.join(dirpath, filename)
                archive_file_path = os.path.relpath(file_path, model_dir)
                zf.write(file_path, archive_file_path)
    memory_file.seek(0)
    return send_file(memory_file, attachment_filename=f'{model_id}.zip', as_attachment=True)



if __name__ == '__main__':
    # app.run(port=8000, debug=True, use_reloader=False)
    disable_html_printouts = False
    if disable_html_printouts:
        logging.getLogger('werkzeug').disabled = True
        os.environ['WERKZEUG_RUN_MAIN'] = True
    # app.run(host="0.0.0.0",port=8008,debug=False) # to enable running on a remote machine
    if not definitions.ASYNC:
        raise Exception(
            "Non async models are not supported by the UI. change definitions.ASYNC to True")
    from waitress import serve
    serve(app, port=8009, threads=20)  # to enable running on a remote machine