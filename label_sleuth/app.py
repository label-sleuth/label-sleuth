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

import getpass
import logging
import os
import tempfile
import traceback
import zipfile

from concurrent.futures.thread import ThreadPoolExecutor
from io import BytesIO, StringIO

from label_sleuth.models.core.languages import Languages

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s')

import dacite
import pandas as pd

from flask import Flask, jsonify, request, send_file, make_response, send_from_directory, current_app, Blueprint
from flask_cors import CORS, cross_origin

from label_sleuth.app_utils import elements_back_to_front, extract_iteration_information_list, \
    extract_enriched_ngrams_and_weights_list, get_element, get_natural_sort_key
from label_sleuth.authentication import authenticate_response, login_if_required, verify_password
from label_sleuth.active_learning.core.active_learning_factory import ActiveLearningFactory
from label_sleuth.config import Configuration
from label_sleuth.models.core.tools import SentenceEmbeddingService
from label_sleuth.configurations.users import User
from label_sleuth.data_access.core.data_structs import LABEL_POSITIVE, LABEL_NEGATIVE, Label
from label_sleuth.data_access.data_access_api import AlreadyExistsException
from label_sleuth.data_access.file_based.file_based_data_access import FileBasedDataAccess
from label_sleuth.models.core.models_background_jobs_manager import ModelsBackgroundJobsManager
from label_sleuth.models.core.models_factory import ModelFactory
from label_sleuth.orchestrator.core.state_api.orchestrator_state_api import IterationStatus, OrchestratorStateApi
from label_sleuth.orchestrator.orchestrator_api import OrchestratorApi

print("user:")
print(getpass.getuser())

main_blueprint = Blueprint("main_blueprint", __name__)
executor = ThreadPoolExecutor(20)


def create_app(config: Configuration, output_dir) -> Flask:
    os.makedirs(output_dir, exist_ok=True)
    app = Flask(__name__, static_folder='./build')
    CORS(app)
    app.config['CORS_HEADERS'] = 'Content-Type'
    app.config["CONFIGURATION"] = config
    app.config["output_dir"] = output_dir
    app.users = {x['username']: dacite.from_dict(data_class=User, data=x) for x in app.config["CONFIGURATION"].users}
    app.tokens = [user.token for user in app.users.values()]
    sentence_embedding_service = SentenceEmbeddingService(output_dir,
                                                          preload_spacy_model_name=config.language.spacy_model_name)
    app.orchestrator_api = OrchestratorApi(OrchestratorStateApi(os.path.join(output_dir, "workspaces")),
                                           FileBasedDataAccess(output_dir),
                                           ActiveLearningFactory(),
                                           ModelFactory(os.path.join(output_dir, "models"),
                                                        ModelsBackgroundJobsManager(),
                                                        sentence_embedding_service),
                                           sentence_embedding_service,
                                           app.config["CONFIGURATION"])
    app.register_blueprint(main_blueprint)
    return app


def start_server(app, host, port, num_serving_threads):
    disable_html_printouts = False
    if disable_html_printouts:
        logging.getLogger('werkzeug').disabled = True
        os.environ['WERKZEUG_RUN_MAIN'] = True

    from waitress import serve
    serve(app, host=host, port=port, threads=num_serving_threads)


@main_blueprint.route("/", defaults={'path': ''})
@main_blueprint.route('/<path:path>')  # catch all routes
def serve(path):
    if path != "" and os.path.exists(current_app.static_folder + '/' + path):
        return send_from_directory(current_app.static_folder, path)

    return send_from_directory(current_app.static_folder, 'index.html')


@main_blueprint.route('/users/authenticate', methods=['POST'])
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
        user = current_app.users.get(username)
        logging.info(f"LOGIN: {user.username}")
        return authenticate_response({
            'username': user.username,
            'token': user.token
        })


"""
Dataset endpoints. Datasets can be shared between workspaces, so these calls are not in the context of a particular
workspace.
"""


@main_blueprint.route("/datasets", methods=['GET'])
@login_if_required
def get_all_dataset_ids():
    """
    Get the names of all existing datasets
    """
    all_datasets = current_app.orchestrator_api.get_all_dataset_names()
    res = {'datasets':
               [{"dataset_id": d} for d in all_datasets]}
    return jsonify(res)


@main_blueprint.route('/datasets/<dataset_name>/add_documents', methods=['POST'])
@cross_origin()
@login_if_required
def add_documents(dataset_name):
    """
    Upload a csv file, and add its contents as a collection of documents in the dataset *dataset_name*.
    If *dataset_name* does not already exist, it is created here. If it does exist, the process of adding documents also
    includes updating labels and model predictions for all workspaces that use this dataset.

    The uploaded csv file must follow the required format, using the relevant column names from DisplayFields.
    Specifically, the file must include a 'text' column, and may optionally include a 'document_id' column as well as
    metadata columns starting with the 'metadata_' prefix.

    :param dataset_name:
    """
    temp_dir = None
    try:
        csv_data = StringIO(request.files['file'].stream.read().decode("utf-8"))
        df = pd.read_csv(csv_data)
        temp_dir = os.path.join(current_app.config["output_dir"], "temp", "csv_upload")
        temp_file_name = f"{next(tempfile._get_candidate_names())}.csv"
        os.makedirs(temp_dir, exist_ok=True)
        temp_file_path = os.path.join(temp_dir, temp_file_name)
        df.to_csv(os.path.join(temp_dir, temp_file_name))
        document_statistics, workspaces_to_update = \
            current_app.orchestrator_api.add_documents_from_file(dataset_name, temp_file_path)
        return jsonify({"dataset_name": dataset_name,
                        "num_docs": document_statistics.documents_loaded,
                        "num_sentences": document_statistics.text_elements_loaded,
                        "workspaces_to_update": workspaces_to_update})
    except AlreadyExistsException as e:
        return jsonify({"dataset_name": dataset_name, "error": "documents already exist", "documents": e.documents,
                        "error_code": 409}), 409
    except Exception:
        logging.exception(f"failed to load or add documents to dataset '{dataset_name}'")
        return jsonify({"dataset_name": dataset_name, "error": traceback.format_exc(), "error_code": 400}), 400
    finally:
        if temp_dir is not None and os.path.exists(os.path.join(temp_dir, temp_file_name)):
            os.remove(os.path.join(temp_dir, temp_file_name))


"""
Workspace endpoints. Each workspace is associated with a particular dataset at creation time.
"""


@main_blueprint.route("/workspace", methods=['POST'])
@login_if_required
def create_workspace():
    """
    Create a new workspace

    :post_param workspace_id: str
    :post_param dataset_id: str
    """
    post_data = request.get_json(force=True)
    workspace_id = post_data["workspace_id"]
    dataset_name = post_data["dataset_id"]

    if current_app.orchestrator_api.workspace_exists(workspace_id):
        logging.info(f"Trying to create workspace '{workspace_id}' which already exists")
        return jsonify({"workspace_id": workspace_id, "error": "workspace already exist",
                        "error_code": 409}), 409
    current_app.orchestrator_api.create_workspace(workspace_id=workspace_id, dataset_name=dataset_name)

    all_document_ids = current_app.orchestrator_api.get_all_document_uris(workspace_id)
    first_document_id = all_document_ids[0]

    res = {'workspace': {'workspace_id': workspace_id,
                         'dataset_name': dataset_name,
                         'first_document_id': first_document_id}}

    return jsonify(res)


@main_blueprint.route("/workspaces", methods=['GET'])
@login_if_required
def get_all_workspace_ids():
    """
    Get the ids of all existing workspaces
    """
    res = {'workspaces': current_app.orchestrator_api.list_workspaces()}
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>", methods=['DELETE'])
@login_if_required
def delete_workspace(workspace_id):
    """
    This call permanently deletes all data associated with the given workspace, including all the categories, user
    labels and models.

    :param workspace_id:
    """
    current_app.orchestrator_api.delete_workspace(workspace_id)
    return jsonify({'workspace_id': workspace_id})


@main_blueprint.route("/workspace/<workspace_id>", methods=['GET'])
@login_if_required
def get_workspace_info(workspace_id):
    """
    Get workspace information

    :param workspace_id:
    :returns a dictionary containing ids for the workspace and dataset as well as for all the documents in the dataset
    """
    document_ids = current_app.orchestrator_api.get_all_document_uris(workspace_id)
    first_document_id = document_ids[0]

    res = {'workspace': {'workspace_id': workspace_id,
                         'dataset_name': current_app.orchestrator_api.get_dataset_name(workspace_id),
                         'first_document_id': first_document_id,
                         'document_ids': document_ids}}
    return jsonify(res)


"""
Category endpoints. A category is defined in the context of a particular workspace. As a user works on the system, all
the labels, classification models etc. are associated with a specific category.
"""


@main_blueprint.route("/workspace/<workspace_id>/category", methods=['POST'])
@login_if_required
def create_category(workspace_id):
    """
    Create a new category in the given workspace

    :param workspace_id:
    :post_param category_name:
    :post_param category_description:
    """
    post_data = request.get_json(force=True)
    post_data['id'] = post_data[
        "category_name"]  # TODO old frontend expects the category name to be in id, remove after moving to new frontend
    current_app.orchestrator_api.create_new_category(workspace_id, post_data["category_name"],
                                                     post_data["category_description"])

    res = {'category': post_data}
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/categories", methods=['GET'])
@login_if_required
def get_all_categories(workspace_id):
    """
    Get information about all existing categories in the workspace

    :param workspace_id:
    """
    categories = current_app.orchestrator_api.get_all_categories(workspace_id)
    category_dicts = [{'id': name, 'category_name': name, 'category_description': category.description}
                      for name, category in sorted(categories.items())]

    res = {'categories': category_dicts}
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/category/<category_name>", methods=['PUT'])
@login_if_required
def rename_category(workspace_id, category_name):
    """
    TODO implement
    :param workspace_id:
    :param category_name:
    :param category_description:
    """
    return "Not Implemented", 503


@main_blueprint.route("/workspace/<workspace_id>/category/<category_name>", methods=['DELETE'])
@login_if_required
def delete_category(workspace_id, category_name):
    """
    This call permanently deletes all data associated with the given category, including user labels and models.

    :param workspace_id:
    :param category_name:
    """
    current_app.orchestrator_api.delete_category(workspace_id, category_name)
    return jsonify({'category': category_name})


"""
Document and element endpoints. The below calls are performed in the context of a particular workspace, and
optionally a particular category. Thus, they may return not just document and element information from the dataset, 
but also category labels, model predictions etc. that are associated with a particular document/element.
"""


@main_blueprint.route("/workspace/<workspace_id>/documents", methods=['GET'])
@login_if_required
def get_all_document_uris(workspace_id):
    """
    Get ids for all documents in the dataset associated with the workspace

    :param workspace_id:
    """

    doc_uris = current_app.orchestrator_api.get_all_document_uris(workspace_id)
    res = {"documents":
               [{"document_id": uri} for uri in doc_uris]}  # TODO change document_id to document_uri in the ui
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/document/<document_uri>", methods=['GET'])
@login_if_required
def get_document_elements(workspace_id, document_uri):
    """
    Get all elements in the given document

    :param workspace_id:
    :param document_uri:
    :request_arg category_name:
    """
    dataset_name = current_app.orchestrator_api.get_dataset_name(workspace_id)
    document = current_app.orchestrator_api.get_documents(workspace_id, dataset_name, [document_uri])[0]
    elements = document.text_elements

    category = None
    if request.args.get('category_name'):
        category = request.args.get('category_name')
    elements_transformed = elements_back_to_front(workspace_id, elements, category)

    res = {'elements': elements_transformed}
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/document/<document_uri>/positive_predictions", methods=['GET'])
@login_if_required
def get_document_positive_predictions(workspace_id, document_uri):
    """
    Get elements in the given document that received a positive prediction from the relevant classification model,
    i.e. the latest trained model for the category specified in the request.

    :param workspace_id:
    :param document_uri:
    :request_arg category_name:
    :request_arg size: number of elements to return
    :request_arg start_idx: get elements starting from this index (for pagination)
    """

    size = int(request.args.get('size', 100))
    start_idx = int(request.args.get('start_idx', 0))
    category_name = request.args.get('category_name')
    if len(current_app.orchestrator_api.get_all_iterations_by_status(workspace_id, category_name,
                                                                     IterationStatus.READY)) == 0:
        elements_transformed = []
    else:
        dataset_name = current_app.orchestrator_api.get_dataset_name(workspace_id)
        document = current_app.orchestrator_api.get_documents(workspace_id, dataset_name, [document_uri])[0]

        elements = document.text_elements

        predictions = [pred.label for pred in current_app.orchestrator_api.infer(workspace_id, category_name, elements)]
        positive_predicted_elements = [element for element, prediction in zip(elements, predictions)
                                       if prediction == LABEL_POSITIVE]

        elements_transformed = elements_back_to_front(workspace_id, positive_predicted_elements, category_name)
        elements_transformed = elements_transformed[start_idx: start_idx + size]
    res = {'elements': elements_transformed}
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/positive_predictions", methods=['GET'])
@login_if_required
def get_positive_predictions(workspace_id):
    """
    Get elements in the given workspace that received a positive prediction from the relevant classification model,
    i.e. the latest trained model for the category specified in the request.

    :param workspace_id:
    :request_arg category_name:
    :request_arg size: number of elements to return
    :request_arg start_idx: get elements starting from this index (for pagination)
    """

    size = int(request.args.get('size', 100))
    start_idx = int(request.args.get('start_idx', 0))
    category_name = request.args.get('category_name')
    all_ready_iterations = current_app.orchestrator_api.get_all_iterations_by_status(workspace_id, category_name,
                                                                                     IterationStatus.READY)
    if len(all_ready_iterations) == 0:
        return jsonify({'hit_count': 0, "positive_fraction": None,'elements': []})
    else:
        # Where labels are applied to duplicate texts (the default behavior), we do not want duplicates to appear in
        # the positive predictions list
        remove_duplicates = current_app.config["CONFIGURATION"].apply_labels_to_duplicate_texts
        positive_predicted_elements = current_app.orchestrator_api.sample_elements_by_prediction(
            workspace_id, category_name, unlabeled_only=False, required_label=LABEL_POSITIVE,
            remove_duplicates=remove_duplicates)
        iteration, iteration_idx = all_ready_iterations[-1]

        sorted_elements = sorted(positive_predicted_elements, key=lambda te: get_natural_sort_key(te.uri))
        elements_transformed = elements_back_to_front(workspace_id, sorted_elements, category_name)
        elements_transformed = elements_transformed[start_idx: start_idx + size]

        res = {'hit_count': len(positive_predicted_elements), "positive_fraction":
            iteration.iteration_statistics["positive_fraction"],'elements': elements_transformed}
        return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/element/<element_id>", methods=['GET'])
@login_if_required
def get_element_by_id(workspace_id, element_id):
    """
    Get the element with the given id

    :param workspace_id:
    :param element_id:
    :request_arg category_name:
    """
    category_name = request.args.get('category_name')
    return get_element(workspace_id, category_name, element_id)


@main_blueprint.route("/workspace/<workspace_id>/query", methods=['GET'])
@login_if_required
def query(workspace_id):
    """
    Query a dataset using the regular expression given in the request, and return elements that meet this search query

    :param workspace_id:
    :request_arg category_name:
    :request_arg qry_string: regular expression
    :request_arg qry_size: number of elements to return
    :request_arg sample_start_idx: get elements starting from this index (for pagination)
    """
    category_name = request.args.get('category_name')
    query_string = request.args.get('qry_string')
    sample_size = int(request.args.get('qry_size', 100))
    sample_start_idx = int(request.args.get('sample_start_idx', 0))

    dataset_name = current_app.orchestrator_api.get_dataset_name(workspace_id)
    resp = current_app.orchestrator_api.query(workspace_id, dataset_name, category_name, query_string,
                                              unlabeled_only=False, sample_size=sample_size,
                                              sample_start_idx=sample_start_idx, remove_duplicates=True)

    sorted_elements = sorted(resp["results"], key=lambda te: get_natural_sort_key(te.uri))
    elements_transformed = elements_back_to_front(workspace_id, sorted_elements, category_name)

    res = {'elements': elements_transformed,
           'hit_count': resp["hit_count"], 'hit_count_unique': resp["hit_count_unique"]}
    return jsonify(res)


"""
Labeling-related endpoints.
"""


@main_blueprint.route('/workspace/<workspace_id>/element/<element_id>', methods=['PUT'])
@login_if_required
def set_element_label(workspace_id, element_id):
    """
    Update element label information. This endpoint either adds or removes a label for a given element and category,
    depending on the 'value' field in the post data.

    :param workspace_id:
    :param element_id:
    :post_param category_name:
    :post_param value: if value == 'none', this element's label for the given category will be removed. Otherwise, the
    element will be assigned a boolean label for the category corresponding to the given string (e.g., "true" -> True)
    :post_param update_counter: determines whether the label changes are reflected in the label change counters
    of the categories. Since an increase in label change counts can trigger the training of a new model, in some
    specific situations this parameter is set to False and the updating of the counter is performed at a later time.
    """
    post_data = request.get_json(force=True)

    category_name = post_data["category_name"]
    value = post_data["value"]
    update_counter = post_data.get('update_counter', True)

    if value == 'none':
        current_app.orchestrator_api. \
            unset_labels(workspace_id, category_name, [element_id],
                         apply_to_duplicate_texts=current_app.config["CONFIGURATION"].apply_labels_to_duplicate_texts)

    else:
        if value in ['true', "True", "TRUE", True]:
            value = True
        elif value in ['false', "False", "FALSE", False]:
            value = False
        else:
            raise Exception(f"cannot convert label to boolean. Input label = {value}")

        uri_with_updated_label = {element_id: {category_name: Label(value)}}
        current_app.orchestrator_api. \
            set_labels(workspace_id, uri_with_updated_label,
                       apply_to_duplicate_texts=current_app.config["CONFIGURATION"].apply_labels_to_duplicate_texts,
                       update_label_counter=update_counter)

    res = {'element': get_element(workspace_id, category_name, element_id), 'workspace_id': workspace_id,
           'category_name': category_name}
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/positive_elements", methods=['GET'])
@login_if_required
def get_all_positive_labeled_elements_for_category(workspace_id):
    """
    Return all elements that were assigned a positive label for the given category by the user

    :param workspace_id:
    :request_arg category_name:
    """
    category = request.args.get('category_name')
    dataset_name = current_app.orchestrator_api.get_dataset_name(workspace_id)
    elements = current_app.orchestrator_api.get_all_labeled_text_elements(workspace_id, dataset_name, category)
    positive_elements = [element for element in elements if element.category_to_label[category].label == LABEL_POSITIVE]

    elements_transformed = elements_back_to_front(workspace_id, positive_elements, category)

    res = {'positive_elements': elements_transformed}
    return jsonify(res)


@main_blueprint.route('/workspace/<workspace_id>/import_labels', methods=['POST'])
@cross_origin()
@login_if_required
def import_labels(workspace_id):
    """
    Upload a csv file, and add its contents as user labels for the workspace. The file may contain labels for more than
    one category.
    The uploaded csv file must follow the required format, using the relevant column names from DisplayFields.
    Specifically, the file must include 'text', 'category_name' and 'label' columns, and may optionally include a
    'document_id' column.
    If document ids are provided AND app.config["CONFIGURATION"].apply_labels_to_duplicate_texts is False, these labels
    will be assigned only to elements in the specified documents; Otherwise, labels are assigned to all elements
    matching the given texts.

    :param workspace_id:
    """
    csv_data = StringIO(request.data.decode("utf-8"))  # TODO use request.data also in load_documents()
    df = pd.read_csv(csv_data, dtype={'labels': str})
    return jsonify(current_app.orchestrator_api.import_category_labels(workspace_id, df))


@main_blueprint.route('/workspace/<workspace_id>/export_labels', methods=['GET'])
@login_if_required
def export_labels(workspace_id):
    """
    Download all user labels from the workspace as a csv file. Each row in the csv is a label for a specific element
    for a specific category. Column names for the various fields are listed under DisplayFields.

    :param workspace_id:
    """
    return current_app.orchestrator_api.export_workspace_labels(workspace_id).to_csv(index=False)


"""
Models and Iterations
"""


@main_blueprint.route("/workspace/<workspace_id>/status", methods=['GET'])
@login_if_required
def get_labelling_status(workspace_id):
    """
    Returns information about the number of user labels for the category, as well as a number between 0-100 that
    reflects when a new model will be trained.
    Once a certain amount of user labels for a given category has been reached, the get_labelling_status() call --
    via a call to orchestrator_api.train_if_recommended() -- will trigger an iteration flow in the background. This
    flow includes training a model, inferring the full corpus using this model, choosing candidate elements for
    labeling using active learning, and calculating various statistics.

    :param workspace_id:
    :request_arg category_name:
    """

    category_name = request.args.get('category_name')
    dataset_name = current_app.orchestrator_api.get_dataset_name(workspace_id)

    labeling_counts = current_app.orchestrator_api. \
        get_label_counts(workspace_id, dataset_name, category_name,
                         remove_duplicates=current_app.config["CONFIGURATION"].apply_labels_to_duplicate_texts)
    progress = current_app.orchestrator_api.get_progress(workspace_id, dataset_name, category_name)

    future = executor.submit(current_app.orchestrator_api.train_if_recommended, workspace_id, category_name)

    return jsonify({
        "labeling_counts": labeling_counts,
        "progress": progress,
        "notifications": []  # TODO remove from UI
    })


@main_blueprint.route("/workspace/<workspace_id>/models", methods=['GET'])
@login_if_required
@cross_origin()
def get_all_models_for_category(workspace_id):
    """
    Return information about all the Iteration flows for this category and their current status.

    :param workspace_id:
    :request_arg category_name:
    :return: array of all iterations sorted from oldest to newest
    """
    category_name = request.args.get('category_name')

    iterations = current_app.orchestrator_api.get_all_iterations_for_category(workspace_id, category_name)
    res = {'models': extract_iteration_information_list(iterations)}
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/active_learning", methods=['GET'])
@login_if_required
def get_elements_to_label(workspace_id):
    """
    If at least one Iteration has completed for the given category, return a list of *size* elements that were
    recommended for labeling by the active learning module.

    :param workspace_id:
    :request_arg category_name:
    :request_arg size: the number of elements to return
    :request_arg start_idx: get elements starting from this index (for pagination)
    """

    category_name = request.args.get('category_name')
    size = int(request.args.get('size', 100))
    start_idx = int(request.args.get('start_idx', 0))

    if len(current_app.orchestrator_api.get_all_iterations_by_status(workspace_id, category_name,
                                                                     IterationStatus.READY)) == 0:
        return jsonify({"elements": []})

    elements = current_app.orchestrator_api.get_elements_to_label(workspace_id, category_name, size, start_idx)
    elements_transformed = elements_back_to_front(workspace_id, elements, category_name)

    res = {'elements': elements_transformed}
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/force_train", methods=['GET'])
@login_if_required
def force_train_for_category(workspace_id):
    """
    This call is used for manually triggering a new Iteration flow.

    :param workspace_id:
    :request_arg category_name:
    """

    category_name = request.args.get('category_name')
    dataset_name = current_app.orchestrator_api.get_dataset_name(workspace_id)
    if category_name not in current_app.orchestrator_api.get_all_categories(workspace_id):
        return jsonify({
            "error": "no such category '" + (category_name if category_name != 'none'
                                             else "<category not provided in category_name param>") + "'"
        })
    model_id = current_app.orchestrator_api.train_if_recommended(workspace_id, category_name, force=True)

    labeling_counts = current_app.orchestrator_api.get_label_counts(workspace_id, dataset_name, category_name)
    logging.info(f"force training a new model in workspace '{workspace_id}' for category '{category_name}', "
                 f"model id: {model_id}")

    return jsonify({
        "labeling_counts": labeling_counts,
        "model_id": model_id
    })


@main_blueprint.route('/workspace/<workspace_id>/export_predictions', methods=['GET'])
@login_if_required
def export_predictions(workspace_id):
    """
    Download the predictions of the model from iteration *iteration_index* of *category_name*, as a csv file.

    :param workspace_id:
    :request_arg category_name:
    :request_arg iteration_index:
    """
    category_name = request.args.get('category_name')
    iteration_index = request.args.get('iteration_index')
    dataset_name = current_app.orchestrator_api.get_dataset_name(workspace_id)
    elements = current_app.orchestrator_api.get_all_text_elements(dataset_name)
    infer_results = current_app.orchestrator_api.infer(workspace_id, category_name, elements,
                                                       iteration_index=iteration_index)
    return pd.DataFrame([{**te.__dict__, "score": pred.score, 'predicted_label': pred.label} for te, pred
                         in zip(elements, infer_results)]).to_csv(index=False)


@main_blueprint.route('/workspace/<workspace_id>/export_model', methods=['GET'])
@login_if_required
def export_model(workspace_id):
    """
    Download the trained model files for the given category and (optionally) iteration index. In order for this
    functionality to work, the ModelType currently in use must implement the ModelAPI.export_model() method.

    :param workspace_id:
    :request_arg category_name:
    :request_arg iteration_index: optional. if not provided, the model from the latest iteration will be exported.
    """
    category_name = request.args.get('category_name')
    iteration_index = request.args.get('iteration_index', None)  # TODO update in UI model_id -> iteration_index
    if iteration_index is None:
        iteration, _ = current_app.orchestrator_api. \
            get_all_iterations_by_status(workspace_id, category_name, IterationStatus.READY)[-1]
    else:
        iteration = current_app.orchestrator_api. \
            get_all_iterations_for_category(workspace_id, category_name)[iteration_index]
    model_id = iteration.model.model_id
    model_dir = current_app.orchestrator_api.export_model(workspace_id, category_name, iteration_index)
    memory_file = BytesIO()
    with zipfile.ZipFile(memory_file, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
        for dirpath, dirnames, filenames in os.walk(model_dir):
            for filename in filenames:
                file_path = os.path.join(dirpath, filename)
                archive_file_path = os.path.relpath(file_path, model_dir)
                zf.write(file_path, archive_file_path)
    memory_file.seek(0)
    return send_file(memory_file, attachment_filename=f'{model_id}.zip', as_attachment=True)


"""
Labeling reports. These calls return labeled elements which the system suggests for review by the user, aiming to 
surface potential errors in the original labeling.
"""


@main_blueprint.route("/workspace/<workspace_id>/disagree_elements", methods=['GET'])
@login_if_required
def get_label_and_model_disagreements(workspace_id):
    """
    Returns all labeled elements where the predictions of the latest model for the category differ from the label
    provided by the user.

    :param workspace_id:
    :request_arg category_name:
    """
    category = request.args.get('category_name')
    dataset_name = current_app.orchestrator_api.get_dataset_name(workspace_id)
    elements = current_app.orchestrator_api.get_all_labeled_text_elements(workspace_id, dataset_name, category)
    elements_transformed = elements_back_to_front(workspace_id, elements, category)

    res = {'disagree_elements':
               [element for element in elements_transformed
                if category in element['model_predictions'] and category in element['user_labels']
                and element['model_predictions'][category] != element['user_labels'][category]]}
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/suspicious_elements", methods=['GET'])
@login_if_required
def get_suspicious_elements(workspace_id):
    """
    This call returns elements where the user label might be incorrect, based on an analysis of all elements
    labeled so far. Elements are ordered from most to least "suspicious" according to the analysis.

    The current implementation relies on the get_disagreements_using_cross_validation() function. In this
    implementation, several models are trained on different parts of the labeled data; labels are suspected as
    incorrect if a model's prediction on a left-out element disagrees with the user label for that element.

    :param workspace_id:
    :request_arg category_name:
    """
    category = request.args.get('category_name')
    try:
        suspicious_elements = current_app.orchestrator_api.get_suspicious_elements_report(workspace_id, category)
        elements_transformed = elements_back_to_front(workspace_id, suspicious_elements, category)
        res = {'elements': elements_transformed}
        return jsonify(res)
    except Exception:
        logging.exception("Failed to generate suspicious elements report")
        res = {'elements': []}
        return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/contradiction_elements", methods=['GET'])
@login_if_required
def get_contradicting_elements(workspace_id):
    """
    This call returns pairs of labeled elements that may be inconsistent with each other. Each pair consists of an
    element given a positive label and an element given a negative label; since the two elements are similar to each
    other, there is a possibility that one of the labels is incorrect. Pairs are sorted from most to least similar
    to each other.
    The current implementation of get_suspected_labeling_contradictions_by_distance() relies on distances between text
    embeddings to identify the opposite-label elements that are similar to each other.
    In addition, for each pair the call returns a list of unique tokens for each element, i.e. tokens that do not appear
    in the other element in the pair. This can be used to visualize the similarities/differences between the two texts.

    :param workspace_id:
    :request_arg category_name:
    """
    category = request.args.get('category_name')
    try:
        contradiction_elements_dict = current_app.orchestrator_api.get_contradiction_report(workspace_id, category)
        element_pairs_transformed = [elements_back_to_front(workspace_id, element_pair, category)
                                     for element_pair in contradiction_elements_dict['pairs']]
        diffs = [[list(element_a_unique_token_set), list(element_b_unique_token_set)]
                 for element_a_unique_token_set, element_b_unique_token_set in contradiction_elements_dict['diffs']]
        res = {'pairs': element_pairs_transformed, 'diffs': diffs}
        return jsonify(res)
    except Exception:
        logging.exception("Failed to generate contradiction report")
        res = {'pairs': []}
        return jsonify(res)


"""
Model evaluation
"""


@main_blueprint.route("/workspace/<workspace_id>/evaluation_elements", methods=['GET'])
@login_if_required
def get_elements_for_precision_evaluation(workspace_id):
    """
    Returns a sample of elements that were predicted as positive for the category by the latest model. This sample is
    used for evaluating the precision of the model predictions: the user is asked to label this sample of elements,
    and after they are labeled the run_precision_evaluation() call will use these labels to estimate model precision.

    :param workspace_id:
    :request_arg category_name:.
    """
    size = current_app.config["CONFIGURATION"].precision_evaluation_size
    category = request.args.get('category_name')
    random_state = len(current_app.orchestrator_api.get_all_iterations_for_category(workspace_id, category))
    positive_predicted_elements = current_app.orchestrator_api. \
        sample_elements_by_prediction(workspace_id, category, size, unlabeled_only=False,
                                      required_label=LABEL_POSITIVE, remove_duplicates=False, random_state=random_state)
    elements_transformed = elements_back_to_front(workspace_id, positive_predicted_elements, category)
    logging.info(f"sampled {len(elements_transformed)} elements for evaluation")
    res = {'elements': elements_transformed}
    return jsonify(res)


@main_blueprint.route('/workspace/<workspace_id>/estimate_precision', methods=['POST'])
@login_if_required
@cross_origin()
def run_precision_evaluation(workspace_id):
    """
    Return a score estimating the precision of *model_id*. This method is triggered manually, and after the
    elements from get_elements_for_precision_evaluation() were labeled by the user.

    :param workspace_id:
    :request_arg category_name:
    :post_param model_id:
    :post_param ids: element ids of the elements labeled for the purpose of precision evaluation
    :post_param changed_elements_count: the number of labels that were added/changed in the labeling of elements
    for evaluation. In order to avoid triggering a new iteration before evaluation is complete, labels set in the
    context of precision evaluation are not immediately reflected in the label change counter of the category, and the
    counts are updated only when calling run_precision_evaluation()
    """
    category_name = request.args.get('category_name')
    post_data = request.get_json(force=True)
    ids = post_data["ids"]
    changed_elements_count = post_data["changed_elements_count"]
    model_id = post_data["model_id"]
    score = current_app.orchestrator_api.estimate_precision(workspace_id, category_name, ids, changed_elements_count,
                                                            model_id)
    res = {'score': score}
    return jsonify(res)


"""
Information on enriched tokens in a specific subset of elements, used for visualization.
"""


@main_blueprint.route("/workspace/<workspace_id>/labeled_info_gain", methods=['GET'])
@login_if_required
def get_labeled_elements_enriched_tokens(workspace_id):
    """
    Returns tokens and bigrams that are characteristic of positively labeled elements versus negatively labeled
    elements for the category, along with weights indicating the relative significance of each token/bigram. These are
    used to visualize the characteristic vocabulary of the category, e.g. using a word cloud. The current
    implementation relies on calculating Mutual Information between the ngrams and the user labels.

    :param workspace_id:
    :request_arg category_name:
    """
    category = request.args.get('category_name')
    dataset_name = current_app.orchestrator_api.get_dataset_name(workspace_id)
    elements = current_app.orchestrator_api.get_all_labeled_text_elements(workspace_id, dataset_name, category)
    res = dict()
    if elements and len(elements) > 0:
        boolean_labels = [element.category_to_label[category].label == LABEL_POSITIVE for element in elements]
        res['info_gain'] = extract_enriched_ngrams_and_weights_list(elements, boolean_labels)
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/predictions_info_gain", methods=['GET'])
@login_if_required
@cross_origin()
def get_predictions_enriched_tokens(workspace_id):
    """
    Returns tokens and bigrams that are characteristic of positively predicted elements versus negatively predicted
    elements by the latest model for the category, along with weights indicating the relative significance of each
    token/bigram. These are used to visualize the characteristic vocabulary of the model predictions, e.g. using a
    word cloud. The current implementation relies on calculating Mutual Information between the ngrams and the model
    predictions.

    :param workspace_id:
    :request_arg category_name:
    """
    res = dict()
    category = request.args.get('category_name')

    if len(current_app.orchestrator_api.get_all_iterations_by_status(workspace_id, category,
                                                                     IterationStatus.READY)) == 0:
        res['info_gain'] = []
        return jsonify(res)

    true_elements = current_app.orchestrator_api.sample_elements_by_prediction(workspace_id, category, 1000,
                                                                               unlabeled_only=True,
                                                                               required_label=LABEL_POSITIVE)
    false_elements = current_app.orchestrator_api.sample_elements_by_prediction(workspace_id, category, 1000,
                                                                                unlabeled_only=True,
                                                                                required_label=LABEL_NEGATIVE)
    elements = true_elements + false_elements
    boolean_labels = [LABEL_POSITIVE] * len(true_elements) + [LABEL_NEGATIVE] * len(false_elements)

    res['info_gain'] = extract_enriched_ngrams_and_weights_list(elements, boolean_labels)
    return jsonify(res)
