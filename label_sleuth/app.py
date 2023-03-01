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
import shutil
import tempfile
import traceback
import zipfile
import pkg_resources
from concurrent.futures.thread import ThreadPoolExecutor
from io import BytesIO, StringIO

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s')

import dacite
import pandas as pd
from flask import Flask, jsonify, request, send_file, make_response, send_from_directory, current_app, Blueprint
from flask_cors import CORS, cross_origin

from label_sleuth.orchestrator.background_jobs_manager import BackgroundJobsManager
from label_sleuth.training_set_selector.training_set_selector_factory import TrainingSetSelectionFactory
from label_sleuth.app_utils import elements_back_to_front, extract_iteration_information_list, \
    extract_enriched_ngrams_and_weights_list, get_element, get_natural_sort_key, validate_category_id, \
    validate_workspace_id
from label_sleuth.authentication import authenticate_response, login_if_required, verify_password
from label_sleuth.active_learning.core.active_learning_factory import ActiveLearningFactory
from label_sleuth.config import Configuration
from label_sleuth.configurations.users import User
from label_sleuth.data_access.core.data_structs import LABEL_POSITIVE, LABEL_NEGATIVE, Label
from label_sleuth.data_access.data_access_api import AlreadyExistsException
from label_sleuth.data_access.file_based.file_based_data_access import FileBasedDataAccess
from label_sleuth.models.core.models_factory import ModelFactory
from label_sleuth.models.core.tools import SentenceEmbeddingService
from label_sleuth.orchestrator.core.state_api.orchestrator_state_api import IterationStatus, OrchestratorStateApi
from label_sleuth.orchestrator.orchestrator_api import OrchestratorApi

print("user:")
print(getpass.getuser())

main_blueprint = Blueprint("main_blueprint", __name__)
executor = ThreadPoolExecutor(20)


class LabelSleuthApp(Flask):
    orchestrator_api: OrchestratorApi
    users: dict
    tokens: list


# in order for the IDE to recognize custom objects within the Label Sleuth flask application -- and specifically
# the methods of OrchestratorApi -- we define a class LabelSleuthApp with these objects and assign this type to
# the flask "current_app" proxy object
curr_app: LabelSleuthApp = current_app


def create_app(config: Configuration, output_dir) -> LabelSleuthApp:
    os.makedirs(output_dir, exist_ok=True)
    app = Flask(__name__, static_folder='./build')
    CORS(app)
    app.config['CORS_HEADERS'] = 'Content-Type'
    app.config["CONFIGURATION"] = config
    app.config["output_dir"] = output_dir
    app.users = {x['username']: dacite.from_dict(data_class=User, data=x) for x in app.config["CONFIGURATION"].users}
    app.tokens = [user.token for user in app.users.values()]
    sentence_embedding_service = SentenceEmbeddingService(embedding_model_dir=output_dir,
                                                          preload_spacy_model_name=config.language.spacy_model_name,
                                                          preload_fasttext_language_id=
                                                          config.language.fasttext_language_id)
    data_access = FileBasedDataAccess(output_dir)
    background_jobs_manager = BackgroundJobsManager()
    training_set_selection_factory = TrainingSetSelectionFactory(data_access, background_jobs_manager)

    app.orchestrator_api = OrchestratorApi(OrchestratorStateApi(os.path.join(output_dir, "workspaces")),
                                           data_access,
                                           ActiveLearningFactory(),
                                           ModelFactory(os.path.join(output_dir, "models"),
                                                        background_jobs_manager,
                                                        sentence_embedding_service),
                                           training_set_selection_factory,
                                           background_jobs_manager,
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
    if path != "" and os.path.exists(curr_app.static_folder + '/' + path):
        return send_from_directory(curr_app.static_folder, path)

    return send_from_directory(curr_app.static_folder, 'index.html')


@main_blueprint.route('/users/authenticate', methods=['POST'])
def login():
    post_data = request.get_json(force=True)
    username = post_data["username"]
    password = post_data["password"]

    if not verify_password(username, password):
        logging.warning(f"Login failed for username {username}")
        return make_response(jsonify({
            'error': "Login failed: wrong username or password"
        }), 401)
    else:
        user = curr_app.users.get(username)
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
    all_datasets = curr_app.orchestrator_api.get_all_dataset_names()
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
        temp_dir = os.path.join(curr_app.config["output_dir"], "temp", "csv_upload")
        temp_file_name = f"{next(tempfile._get_candidate_names())}.csv"
        os.makedirs(temp_dir, exist_ok=True)
        temp_file_path = os.path.join(temp_dir, temp_file_name)
        df.to_csv(os.path.join(temp_dir, temp_file_name))
        document_statistics, workspaces_to_update = \
            curr_app.orchestrator_api.add_documents_from_file(dataset_name, temp_file_path)
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

    if curr_app.orchestrator_api.workspace_exists(workspace_id):
        logging.info(f"Trying to create workspace '{workspace_id}' which already exists")
        return jsonify({"workspace_id": workspace_id, "error": "Workspace already exists",
                        "error_code": 409}), 409
    curr_app.orchestrator_api.create_workspace(workspace_id=workspace_id, dataset_name=dataset_name)

    all_document_ids = curr_app.orchestrator_api.get_all_document_uris(workspace_id)
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
    res = {'workspaces': curr_app.orchestrator_api.list_workspaces()}
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>", methods=['DELETE'])
@login_if_required
@validate_workspace_id
def delete_workspace(workspace_id):
    """
    This call permanently deletes all data associated with the given workspace, including all the categories, user
    labels and models.

    :param workspace_id:
    """
    curr_app.orchestrator_api.delete_workspace(workspace_id)
    return jsonify({'workspace_id': workspace_id})


@main_blueprint.route("/workspace/<workspace_id>", methods=['GET'])
@login_if_required
@validate_workspace_id
def get_workspace_info(workspace_id):
    """
    Get workspace information

    :param workspace_id:
    :returns a dictionary containing ids for the workspace and dataset as well as for all the documents in the dataset
    """
    document_ids = curr_app.orchestrator_api.get_all_document_uris(workspace_id)
    first_document_id = document_ids[0]

    res = {'workspace': {'workspace_id': workspace_id,
                         'dataset_name': curr_app.orchestrator_api.get_dataset_name(workspace_id),
                         'first_document_id': first_document_id,
                         'document_ids': document_ids}}
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/load_dataset", methods=['POST'])
@login_if_required
@validate_workspace_id
def load_dataset(workspace_id):
    """
    Initial load of large datasets can take a while. The UI can call this endpoint to start a background loading of the
    dataset to the memory immediately after the workspace was selected. This will save time in subsequent calls to
    endpoints which require the dataset.

    :param workspace_id:
    """
    executor.submit(curr_app.orchestrator_api.preload_dataset, workspace_id)
    return jsonify({"success": True})



"""
Category endpoints. A category is defined in the context of a particular workspace. As a user works on the system, all
the labels, classification models etc. are associated with a specific category.
"""


@main_blueprint.route("/workspace/<workspace_id>/category", methods=['POST'])
@login_if_required
@validate_workspace_id
def create_category(workspace_id):
    """
    Create a new category in the given workspace

    :param workspace_id:
    :post_param category_name:
    :post_param category_description:
    """
    post_data = request.get_json(force=True)
    category_name = post_data["category_name"]
    category_description = post_data["category_description"]
    existing_category_names = [category.name for category
                               in curr_app.orchestrator_api.get_all_categories(workspace_id).values()]
    if category_name in existing_category_names:
        return jsonify({"workspace_id": workspace_id, "error": "A category with this name already exists",
                        "category_name": category_name, "error_code": 409}), 409

    category_id = curr_app.orchestrator_api.create_new_category(workspace_id, category_name, category_description)

    post_data['category_id'] = str(category_id)

    return jsonify(post_data)


@main_blueprint.route("/workspace/<workspace_id>/categories", methods=['GET'])
@login_if_required
@validate_workspace_id
def get_all_categories(workspace_id):
    """
    Get information about all existing categories in the workspace

    :param workspace_id:
    """
    categories = curr_app.orchestrator_api.get_all_categories(workspace_id)
    category_dicts = [{'category_id': id, 'category_name': category.name, 'category_description': category.description}
                      for id, category in categories.items()]

    res = {'categories': category_dicts}

    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/category/<category_id>", methods=['PUT'])
@login_if_required
@validate_workspace_id
def update_category(workspace_id, category_id):
    """
    :param workspace_id:
    :param category_id:
    :post_param category_name:
    :post_param category_description:
    """
    try:
        category_id = int(category_id)
    except:
        return jsonify({"type": "category_id_error",
                        "title": f"category_id should be an integer (got {category_id}) "}), 400

    if category_id not in curr_app.orchestrator_api.get_all_categories(workspace_id):
        return jsonify({"type": "category_id_does_not_exist",
                        "title": f"category_id {category_id} does not exist in workspace {workspace_id}"}), 404

    post_data = request.get_json(force=True)
    new_category_name = post_data["category_name"]
    new_category_description = post_data["category_description"]
    existing_category_names = [category.name for category
                               in curr_app.orchestrator_api.get_all_categories(workspace_id).values()]
    if new_category_name in existing_category_names:
        return jsonify({"workspace_id": workspace_id, "error": "A category with this name already exists",
                        "category_name": new_category_name, "error_code": 409}), 409

    curr_app.orchestrator_api.edit_category(workspace_id, category_id, new_category_name, new_category_description)
    return jsonify({"workspace_id": workspace_id, "category_id": str(category_id), "category_name": new_category_name,
                    "category_description": new_category_description})


@main_blueprint.route("/workspace/<workspace_id>/category/<category_id>", methods=['DELETE'])
@login_if_required
@validate_workspace_id
def delete_category(workspace_id, category_id):
    """
    This call permanently deletes all data associated with the given category, including user labels and models.

    :param workspace_id:
    :param category_id:
    """
    try:
        category_id = int(category_id)
    except:
        return jsonify({"type": "category_id_error",
                        "title": f"category_id should be an integer (got {category_id}) "}), 400

    if category_id not in curr_app.orchestrator_api.get_all_categories(workspace_id):
        return jsonify({"type": "category_id_does_not_exist",
                        "title": f"category_id {category_id} does not exist in workspace {workspace_id}"}), 404

    curr_app.orchestrator_api.delete_category(workspace_id, category_id)
    return jsonify({"workspace_id": workspace_id, 'category_id': str(category_id)})


"""
Document and element endpoints. The below calls are performed in the context of a particular workspace, and
optionally a particular category. Thus, they may return not just document and element information from the dataset, 
but also category labels, model predictions etc. that are associated with a particular document/element.
"""


@main_blueprint.route("/workspace/<workspace_id>/documents", methods=['GET'])
@login_if_required
@validate_workspace_id
def get_all_document_uris(workspace_id):
    """
    Get ids for all documents in the dataset associated with the workspace

    :param workspace_id:
    """

    doc_uris = curr_app.orchestrator_api.get_all_document_uris(workspace_id)
    res = {"documents": [{"document_id": uri} for uri in doc_uris]}
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/document/<document_uri>", methods=['GET'])
@login_if_required
@validate_workspace_id
def get_document_elements(workspace_id, document_uri):
    """
    Get all elements in the given document

    :param workspace_id:
    :param document_uri:
    :request_arg category_id:
    :request_arg size: number of elements to return
    :request_arg start_idx: get elements starting from this index (for pagination)
    """

    size = int(request.args.get('size', curr_app.config["CONFIGURATION"].main_panel_elements_per_page))
    start_idx = int(request.args.get('start_idx', 0))
    dataset_name = curr_app.orchestrator_api.get_dataset_name(workspace_id)
    document = curr_app.orchestrator_api.get_documents(workspace_id, dataset_name, [document_uri])[0]
    elements = document.text_elements
    category_id = request.args.get('category_id')
    if category_id is not None:
        category_id = int(category_id)
    hit_count = len(elements)
    elements = elements[start_idx: start_idx + size]
    elements_transformed = elements_back_to_front(workspace_id, elements, category_id)

    res = {'elements': elements_transformed, 'hit_count': hit_count}
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/document/<document_uri>/positive_predictions", methods=['GET'])
@login_if_required
@validate_category_id
@validate_workspace_id
def get_document_positive_predictions(workspace_id, document_uri):
    """
    Get elements in the given document that received a positive prediction from the relevant classification model,
    i.e. the latest trained model for the category specified in the request.

    :param workspace_id:
    :param document_uri:
    :request_arg category_id:
    :request_arg size: number of elements to return
    :request_arg start_idx: get elements starting from this index (for pagination)
    """
    category_id = int(request.args['category_id'])
    size = int(request.args.get('size', curr_app.config["CONFIGURATION"].sidebar_panel_elements_per_page))
    start_idx = int(request.args.get('start_idx', 0))

    if len(curr_app.orchestrator_api.get_all_iterations_by_status(workspace_id, category_id,
                                                                  IterationStatus.READY)) == 0:
        elements_transformed = []
    else:
        dataset_name = curr_app.orchestrator_api.get_dataset_name(workspace_id)
        document = curr_app.orchestrator_api.get_documents(workspace_id, dataset_name, [document_uri])[0]

        elements = document.text_elements

        predictions = [pred.label for pred in curr_app.orchestrator_api.infer(workspace_id, category_id, elements)]
        positive_predicted_elements = [element for element, prediction in zip(elements, predictions)
                                       if prediction == LABEL_POSITIVE]

        positive_predicted_elements = positive_predicted_elements[start_idx: start_idx + size]
        elements_transformed = elements_back_to_front(workspace_id, positive_predicted_elements, category_id)
    res = {'elements': elements_transformed}
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/positive_predictions", methods=['GET'])
@login_if_required
@validate_category_id
@validate_workspace_id
def get_positive_predictions(workspace_id):
    """
    Get elements in the given workspace that received a positive prediction from the relevant classification model,
    i.e. the latest trained model for the category specified in the request.
    As finding and returning _all_ the positively predicted elements is expensive, this endpoint only finds as many
    elements as is required by the request.

    :param workspace_id:
    :request_arg category_id:
    :request_arg size: number of elements to return
    :request_arg start_idx: get elements starting from this index (for pagination)
    """
    category_id = int(request.args['category_id'])
    size = int(request.args.get('size', curr_app.config["CONFIGURATION"].sidebar_panel_elements_per_page))
    start_idx = int(request.args.get('start_idx', 0))

    all_ready_iterations = curr_app.orchestrator_api.get_all_iterations_by_status(workspace_id, category_id,
                                                                                  IterationStatus.READY)
    if len(all_ready_iterations) == 0:
        return jsonify({'elements': [], 'positive_fraction': None, 'total_count': None})
    else:
        positive_predicted_elements = curr_app.orchestrator_api.get_elements_by_prediction(
            workspace_id, category_id, LABEL_POSITIVE, sample_size=size, start_idx=start_idx, shuffle=False,
            remove_duplicates=False)  # For better performance in large datasets, we do not remove duplicates
        iteration, _ = all_ready_iterations[-1]

        elements_transformed = elements_back_to_front(workspace_id, positive_predicted_elements, category_id)

        positive_fraction = iteration.iteration_statistics["positive_fraction"]
        total_positive_count = iteration.iteration_statistics.get(
            'total_positive_count', int(positive_fraction * curr_app.orchestrator_api.get_text_element_count(workspace_id)))
        res = {'elements': elements_transformed,
               'positive_fraction': positive_fraction, 'total_count': total_positive_count}
        return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/element/<element_id>", methods=['GET'])
@login_if_required
@validate_workspace_id
def get_element_by_id(workspace_id, element_id):
    """
    Get the element with the given id

    :param workspace_id:
    :param element_id:
    :request_arg category_id:
    """
    category_id = request.args.get('category_id')
    if category_id is not None:
        category_id = int(category_id)
    return get_element(workspace_id, category_id, element_id)


@main_blueprint.route("/workspace/<workspace_id>/query", methods=['GET'])
@login_if_required
@validate_workspace_id
def query(workspace_id):
    """
    Query a dataset using the regular expression given in the request, and return elements that meet this search query

    :param workspace_id:
    :request_arg category_id:
    :request_arg qry_string: query string
    :request_arg size: number of elements to return
    :request_arg start_idx: get elements starting from this index (for pagination)
    """
    category_id = request.args.get('category_id')
    if category_id is not None:
        category_id = int(category_id)
    query_string = request.args.get('qry_string')
    sample_size = int(request.args.get('size', curr_app.config["CONFIGURATION"].sidebar_panel_elements_per_page))
    sample_start_idx = int(request.args.get('start_idx', 0))

    dataset_name = curr_app.orchestrator_api.get_dataset_name(workspace_id)
    resp = curr_app.orchestrator_api.query(workspace_id, dataset_name, category_id=None,
                                           query=query_string, is_regex=False,
                                           unlabeled_only=False, sample_size=sample_size,
                                           sample_start_idx=sample_start_idx, remove_duplicates=True)
    sorted_elements = sorted(resp["results"], key=lambda te: get_natural_sort_key(te.uri))
    elements_transformed = elements_back_to_front(workspace_id, sorted_elements, category_id)
    res = {'elements': elements_transformed,
           'hit_count': resp["hit_count"],
           'hit_count_unique': resp["hit_count_unique"]}
    return jsonify(res)


"""
Labeling-related endpoints.
"""


@main_blueprint.route('/workspace/<workspace_id>/element/<element_id>', methods=['PUT'])
@login_if_required
@validate_workspace_id
def set_element_label(workspace_id, element_id):
    """
    Update element label information. This endpoint either adds or removes a label for a given element and category,
    depending on the 'value' field in the post data.

    :param workspace_id:
    :param element_id:
    :post_param category_id:
    :post_param value: if value == 'none', this element's label for the given category will be removed. Otherwise, the
    element will be assigned a boolean label for the category corresponding to the given string (e.g., "true" -> True)
    :post_param update_counter: determines whether the label changes are reflected in the label change counters
    of the categories. Since an increase in label change counts can trigger the training of a new model, in some
    specific situations this parameter is set to False and the updating of the counter is performed at a later time.
    """
    post_data = request.get_json(force=True)

    if "category_id" not in post_data:
        return jsonify({"type": "missing_category_id", "title": "category_id was not provided in post data"}), 422

    category_id = int(post_data["category_id"])
    value = post_data["value"]
    update_counter = post_data.get('update_counter', True)

    if value == 'none':
        curr_app.orchestrator_api. \
            unset_labels(workspace_id, category_id, [element_id],
                         apply_to_duplicate_texts=curr_app.config["CONFIGURATION"].apply_labels_to_duplicate_texts)

    else:
        if value in ['true', "True", "TRUE", True]:
            value = True
        elif value in ['false', "False", "FALSE", False]:
            value = False
        else:
            raise Exception(f"cannot convert label to boolean. Input label = {value}")

        uri_with_updated_label = {element_id: {category_id: Label(value)}}
        curr_app.orchestrator_api. \
            set_labels(workspace_id, uri_with_updated_label,
                       apply_to_duplicate_texts=curr_app.config["CONFIGURATION"].apply_labels_to_duplicate_texts,
                       update_label_counter=update_counter)

    res = {'element': get_element(workspace_id, category_id, element_id), 'workspace_id': workspace_id,
           'category_id': str(category_id)}
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/positive_elements", methods=['GET'])
@login_if_required
@validate_category_id
@validate_workspace_id
def get_all_positively_labeled_elements_for_category(workspace_id):
    """
    Return all elements that were assigned a positive label for the given category by the user

    :param workspace_id:
    :request_arg category_id:
    :request_arg size: number of elements to return
    :request_arg start_idx: get elements starting from this index (for pagination)
    """
    size = int(request.args.get('size', curr_app.config["CONFIGURATION"].sidebar_panel_elements_per_page))
    start_idx = int(request.args.get('start_idx', 0))
    category_id = int(request.args['category_id'])
    elements, hit_count = get_all_labeled_elements(workspace_id, category_id, label=LABEL_POSITIVE, size=size,
                                                   start_idx=start_idx)

    res = {'elements': elements, "hit_count": hit_count}
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/negative_elements", methods=['GET'])
@login_if_required
@validate_category_id
@validate_workspace_id
def get_all_negatively_labeled_elements_for_category(workspace_id):
    """
    Return all elements that were assigned a negative label for the given category by the user

    :param workspace_id:
    :request_arg category_id:
    :request_arg size: number of elements to return
    :request_arg start_idx: get elements starting from this index (for pagination)
    """
    category_id = int(request.args['category_id'])
    size = int(request.args.get('size', curr_app.config["CONFIGURATION"].sidebar_panel_elements_per_page))
    start_idx = int(request.args.get('start_idx', 0))
   
    elements, hit_count = get_all_labeled_elements(workspace_id, category_id, label=LABEL_NEGATIVE, size=size,
                                                   start_idx=start_idx)

    res = {'elements': elements, "hit_count": hit_count}
    return jsonify(res)


def get_all_labeled_elements(workspace_id, category_id, label=None, size: int = 100, start_idx: int = 0):
    """
    Return all elements that were assigned the given label, or all labeled elements if label is None

    :param workspace_id:
    :param category_id:
    :param label: return only elements assigned this label; if None, return all labeled elements
    :param size: number of elements to return
    :param start_idx: get elements starting from this index (for pagination)
    """
    dataset_name = curr_app.orchestrator_api.get_dataset_name(workspace_id)
    elements = curr_app.orchestrator_api.get_all_labeled_text_elements(workspace_id, dataset_name, category_id,
                                                                       remove_duplicates=True)
    if label is not None:
        elements = [element for element in elements
                    if element.category_to_label[category_id].label == label]
    hit_count = len(elements)
    elements = elements[start_idx: start_idx + size]
    elements_transformed = elements_back_to_front(workspace_id, elements, category_id)
    return elements_transformed, hit_count


@main_blueprint.route('/workspace/<workspace_id>/import_labels', methods=['POST'])
@cross_origin()
@login_if_required
@validate_workspace_id
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
    csv_data = StringIO(request.files['file'].stream.read().decode("utf-8"))
    df = pd.read_csv(csv_data)

    return jsonify(curr_app.orchestrator_api.import_category_labels(workspace_id, df))


@main_blueprint.route('/workspace/<workspace_id>/export_labels', methods=['GET'])
@login_if_required
@validate_workspace_id
def export_labels(workspace_id):
    """
    Download all user labels from the workspace as a csv file. Each row in the csv is a label for a specific element
    for a specific category. Column names for the various fields are listed under DisplayFields.

    :param workspace_id:
    :request_arg labeled_only: only export elements as they were labeled by the user. If set to False, use the
    TrainingSetSelectionStrategy to determine the exported elements
    """
    labeled_only = request.args.get('labeled_only', "true")
    labeled_only = labeled_only.lower() == "true"

    return curr_app.orchestrator_api.export_workspace_labels(workspace_id, labeled_only).to_csv(index=False)


"""
Models and Iterations
"""


@main_blueprint.route("/workspace/<workspace_id>/status", methods=['GET'])
@login_if_required
@validate_category_id
@validate_workspace_id
def get_labelling_status(workspace_id):
    """
    Returns information about the number of user labels for the category, as well as a number between 0-100 that
    reflects when a new model will be trained.
    Once a certain amount of user labels for a given category has been reached, the get_labelling_status() call --
    via a call to orchestrator_api.train_if_recommended() -- will trigger an iteration flow in the background. This
    flow includes training a model, inferring the full corpus using this model, choosing candidate elements for
    labeling using active learning, and calculating various statistics.

    :param workspace_id:
    :request_arg category_id:
    """

    category_id = int(request.args['category_id'])
    dataset_name = curr_app.orchestrator_api.get_dataset_name(workspace_id)

    labeling_counts = curr_app.orchestrator_api. \
        get_label_counts(workspace_id, dataset_name, category_id,
                         remove_duplicates=curr_app.config["CONFIGURATION"].apply_labels_to_duplicate_texts)
    progress = curr_app.orchestrator_api.get_progress(workspace_id, dataset_name, category_id)

    # TODO move executor to the orchestrator
    executor.submit(curr_app.orchestrator_api.train_if_recommended, workspace_id, category_id)

    return jsonify({
        "labeling_counts": labeling_counts,
        "progress": progress
    })


@main_blueprint.route("/workspace/<workspace_id>/models", methods=['GET'])
@login_if_required
@validate_category_id
@validate_workspace_id
@cross_origin()
def get_all_models_for_category(workspace_id):
    """
    Return information about all the Iteration flows for this category and their current status.

    :param workspace_id:
    :request_arg category_id:
    :return: array of all iterations sorted from oldest to newest
    """
    category_id = int(request.args['category_id'])
    iterations = curr_app.orchestrator_api.get_all_iterations_for_category(workspace_id, category_id)
    res = {'models': extract_iteration_information_list(iterations)}
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/active_learning", methods=['GET'])
@login_if_required
@validate_category_id
@validate_workspace_id
def get_elements_to_label(workspace_id):
    """
    If at least one Iteration has completed for the given category, return a list of *size* elements that were
    recommended for labeling by the active learning module.

    :param workspace_id:
    :request_arg category_id:
    :request_arg size: the number of elements to return
    :request_arg start_idx: get elements starting from this index (for pagination)
    """
    category_id = int(request.args['category_id'])
    size = int(request.args.get('size', curr_app.config["CONFIGURATION"].sidebar_panel_elements_per_page))
    start_idx = int(request.args.get('start_idx', 0))

    if len(curr_app.orchestrator_api.get_all_iterations_by_status(workspace_id, category_id,
                                                                  IterationStatus.READY)) == 0:
        return jsonify({"elements": []})

    elements, hit_count = curr_app.orchestrator_api.get_elements_to_label(workspace_id, category_id, size, start_idx)
    elements_transformed = elements_back_to_front(workspace_id, elements, category_id)

    res = {'elements': elements_transformed, 'hit_count': hit_count}
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/force_train", methods=['GET'])
@login_if_required
@validate_category_id
@validate_workspace_id
def force_train_for_category(workspace_id):
    """
    This call is used for manually triggering a new Iteration flow.

    :param workspace_id:
    :request_arg category_id:
    """
    category_id = int(request.args['category_id'])
    dataset_name = curr_app.orchestrator_api.get_dataset_name(workspace_id)

    model_id = curr_app.orchestrator_api.train_if_recommended(workspace_id, category_id, force=True)

    labeling_counts = curr_app.orchestrator_api.get_label_counts(workspace_id, dataset_name, category_id)
    logging.info(f"force training a new model in workspace '{workspace_id}' for category '{category_id}', "
                 f"model id: {model_id}")

    return jsonify({
        "labeling_counts": labeling_counts,
        "model_id": model_id
    })


@main_blueprint.route('/workspace/<workspace_id>/export_predictions', methods=['GET'])
@login_if_required
@validate_category_id
@validate_workspace_id
def export_predictions(workspace_id):
    """
    Download all predictions of the model from iteration *iteration_index* of *category_id*, as a csv file.

    :param workspace_id:
    :request_arg category_id:
    :request_arg iteration_index: optional. if not provided, the model from the latest iteration will be exported.
    """
    category_id = int(request.args['category_id'])
    iteration_index = request.args.get('iteration_index', None)
    if iteration_index is None:
        _, iteration_index = curr_app.orchestrator_api. \
            get_all_iterations_by_status(workspace_id, category_id, IterationStatus.READY)[-1]
    else:
        iteration_index = int(iteration_index)
    dataset_name = curr_app.orchestrator_api.get_dataset_name(workspace_id)
    elements = curr_app.orchestrator_api.get_all_text_elements(dataset_name)
    infer_results = curr_app.orchestrator_api.infer(workspace_id, category_id, elements,
                                                    iteration_index=iteration_index)
    return pd.DataFrame([{**te.__dict__, "score": pred.score, 'predicted_label': pred.label} for te, pred
                         in zip(elements, infer_results)]).to_csv(index=False)


@main_blueprint.route('/workspace/<workspace_id>/export_model', methods=['GET'])
@login_if_required
@validate_category_id
@validate_workspace_id
def export_model(workspace_id):
    """
    Download the trained model files for the given category and (optionally) iteration index.

    :param workspace_id:
    :request_arg category_id:
    :request_arg iteration_index: optional. if not provided, the model from the latest iteration will be exported.
    """

    usage_example = "from label_sleuth.models.util.standalone_inference import get_model_api\n\n" \
                    "model_path = \"<replace_with_the_exported_model_path>\"\n" \
                    "items_to_infer = [{\"text\": \"I love dogs\"}, {\"text\": \"I love cats\"}]\n" \
                    "model_api = get_model_api(model_path)\n" \
                    "model = model_api.load_model(model_path)\n" \
                    "predictions = model_api.infer(model, items_to_infer)\n" \
                    "for sentence_dict, pred in zip(items_to_infer, predictions):\n" \
                    "     print(f'sentence: \"{sentence_dict[\"text\"]}\" -> prediction: {pred}')\n"
    category_id = int(request.args['category_id'])
    iteration_index = request.args.get('iteration_index', None)
    logging.info(f"Exporting a model from workspace {workspace_id} category id {category_id}")
    if iteration_index is None:
        _, iteration_index = curr_app.orchestrator_api. \
            get_all_iterations_by_status(workspace_id, category_id, IterationStatus.READY)[-1]
    else:
        iteration_index = int(iteration_index)

    temp_model_dir = curr_app.orchestrator_api.copy_model_dir_for_export(workspace_id, category_id, iteration_index)
    try:
        memory_file = BytesIO()

        with zipfile.ZipFile(memory_file, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
            for dirpath, dirnames, filenames in os.walk(temp_model_dir):
                for filename in filenames:
                    file_path = os.path.join(dirpath, filename)
                    archive_file_path = os.path.relpath(file_path, temp_model_dir)
                    zf.write(file_path, archive_file_path)

            # write usage example python file
            model_usage_example_file_path = os.path.join(temp_model_dir, "model_usage_example.py")
            with open(model_usage_example_file_path,'w') as text_file:
                text_file.write(usage_example)
            archive_file_path = os.path.relpath(model_usage_example_file_path, temp_model_dir)
            zf.write(model_usage_example_file_path, archive_file_path)

        memory_file.seek(0)
    finally:
        if os.path.exists(temp_model_dir):
            shutil.rmtree(temp_model_dir, ignore_errors=True)
    return send_file(memory_file, attachment_filename=f'model.zip', as_attachment=True)


"""
Labeling reports. These calls return labeled elements which the system suggests for review by the user, aiming to 
surface potential errors in the original labeling.
"""


@main_blueprint.route("/workspace/<workspace_id>/disagree_elements", methods=['GET'])
@login_if_required
@validate_category_id
@validate_workspace_id
def get_label_and_model_disagreements(workspace_id):
    """
    Returns all labeled elements where the predictions of the latest model for the category differ from the label
    provided by the user.

    :param workspace_id:
    :request_arg category_id:
    """

    category_id = int(request.args['category_id'])
    dataset_name = curr_app.orchestrator_api.get_dataset_name(workspace_id)
    elements = curr_app.orchestrator_api.get_all_labeled_text_elements(workspace_id, dataset_name, category_id)
    elements_transformed = elements_back_to_front(workspace_id, elements, category_id)

    res = {'disagree_elements':
               [element for element in elements_transformed
                if category_id in element['model_predictions'] and category_id in element['user_labels']
                and element['model_predictions'][category_id] != element['user_labels'][category_id]]}
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/suspicious_elements", methods=['GET'])
@login_if_required
@validate_category_id
@validate_workspace_id
def get_suspicious_elements(workspace_id):
    """
    This call returns elements where the user label might be incorrect, based on an analysis of all elements
    labeled so far. Elements are ordered from most to least "suspicious" according to the analysis.

    The current implementation relies on the get_disagreements_using_cross_validation() function. In this
    implementation, several models are trained on different parts of the labeled data; labels are suspected as
    incorrect if a model's prediction on a left-out element disagrees with the user label for that element.

    :param workspace_id:
    :request_arg category_id:
    :request_arg size: number of elements to return
    :request_arg start_idx: get elements starting from this index (for pagination)
    """
    size = int(request.args.get('size', curr_app.config["CONFIGURATION"].sidebar_panel_elements_per_page))
    start_idx = int(request.args.get('start_idx', 0))
    category_id = int(request.args['category_id'])
    
    try:
        suspicious_elements = curr_app.orchestrator_api.get_suspicious_elements_report(workspace_id, category_id)
        hit_count = len(suspicious_elements)
        suspicious_elements = suspicious_elements[start_idx: start_idx + size]
        elements_transformed = elements_back_to_front(workspace_id, suspicious_elements, category_id)
        res = {'elements': elements_transformed, 'hit_count': hit_count}
        return jsonify(res)
    except Exception:
        logging.exception("Failed to generate suspicious elements report")
        res = {'elements': [], 'hit_count': 0}
        return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/contradiction_elements", methods=['GET'])
@login_if_required
@validate_category_id
@validate_workspace_id
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
    :request_arg category_id:
    :request_arg size: number of elements to return
    :request_arg start_idx: get elements starting from this index (for pagination)
    """
    category_id = int(request.args['category_id'])
    size = int(request.args.get('size', curr_app.config["CONFIGURATION"].sidebar_panel_elements_per_page))
    start_idx = int(request.args.get('start_idx', 0))
    try:
        contradiction_elements_dict = curr_app.orchestrator_api.get_contradiction_report(workspace_id, category_id)
        element_pairs_transformed = [elements_back_to_front(workspace_id, element_pair, category_id)
                                     for element_pair in contradiction_elements_dict['pairs']]
        hit_count = len(element_pairs_transformed)
        element_pairs_transformed = element_pairs_transformed[start_idx: start_idx + size]
        diffs = [[list(element_a_unique_token_set), list(element_b_unique_token_set)]
                 for element_a_unique_token_set, element_b_unique_token_set in contradiction_elements_dict['diffs']]
        res = {'pairs': element_pairs_transformed, 'diffs': diffs, 'hit_count': hit_count}
        return jsonify(res)
    except Exception:
        logging.exception(f"Failed to generate contradiction report for workspace "
                          f"{workspace_id} category_id {category_id}")
        return jsonify({"type": "contradiction_report_generation_error", "title":
            f"Failed to generate contradiction report for workspace {workspace_id} category_id {category_id}"}), 500


"""
Model evaluation
"""


@main_blueprint.route("/workspace/<workspace_id>/precision_evaluation_elements", methods=['GET'])
@login_if_required
@validate_category_id
@validate_workspace_id
def get_elements_for_precision_evaluation(workspace_id):
    """
    Returns a sample of elements that were predicted as positive for the category by the latest model. This sample is
    used for evaluating the precision of the model predictions: the user is asked to label this sample of elements,
    and after they are labeled the run_precision_evaluation() call will use these labels to estimate model precision.

    :param workspace_id:
    :request_arg category_id:.
    """
    size = curr_app.config["CONFIGURATION"].precision_evaluation_size
    category_id = int(request.args['category_id'])
    random_state = len(curr_app.orchestrator_api.get_all_iterations_for_category(workspace_id, category_id))
    positive_predicted_elements = curr_app.orchestrator_api.\
        get_elements_by_prediction(workspace_id, category_id, required_prediction=LABEL_POSITIVE, sample_size=size,
                                   remove_duplicates=False, shuffle=True, random_state=random_state)
    elements_transformed = elements_back_to_front(workspace_id, positive_predicted_elements, category_id)
    logging.info(f"sampled {len(elements_transformed)} elements for evaluation")
    res = {'elements': elements_transformed}
    return jsonify(res)


@main_blueprint.route('/workspace/<workspace_id>/precision_evaluation_elements', methods=['POST'])
@login_if_required
@validate_category_id
@validate_workspace_id
@cross_origin()
def run_precision_evaluation(workspace_id):
    """
    Return a score estimating the precision of *model_id*. This method is triggered manually, and after the
    elements from get_elements_for_precision_evaluation() were labeled by the user.

    :param workspace_id:
    :request_arg category_id:
    :post_param iteration:
    :post_param ids: element ids of the elements labeled for the purpose of precision evaluation
    :post_param changed_elements_count: the number of labels that were added/changed in the labeling of elements
    for evaluation. In order to avoid triggering a new iteration before evaluation is complete, labels set in the
    context of precision evaluation are not immediately reflected in the label change counter of the category, and the
    counts are updated only when calling run_precision_evaluation() or cancel_precision_evaluation()
    """
    category_id = int(request.args['category_id'])
    post_data = request.get_json(force=True)
    ids = post_data["ids"]
    changed_elements_count = post_data["changed_elements_count"]
    iteration_index = post_data["iteration"]
    score = curr_app.orchestrator_api.estimate_precision(workspace_id, category_id, ids, changed_elements_count,
                                                         iteration_index)
    res = {'score': score}
    return jsonify(res)


@main_blueprint.route('/workspace/<workspace_id>/cancel_precision_evaluation', methods=['POST'])
@login_if_required
@validate_category_id
@validate_workspace_id
def cancel_precision_evaluation(workspace_id):
    """
    Exit the precision evaluation, and allow the evaluation elements labeled so far to be reflected in the
    label change counter

    :param workspace_id:
    :request_arg category_id:
    :post_param changed_elements_count: the number of labels that were added/changed in the labeling of elements
    for evaluation. In order to avoid triggering a new iteration before evaluation is complete, labels set in the
    context of precision evaluation are not immediately reflected in the label change counter of the category, and the
    counts are updated only when calling run_precision_evaluation() or cancel_precision_evaluation()

    """
    category_id = int(request.args['category_id'])
    post_data = request.get_json(force=True)
    changed_elements_count = post_data["changed_elements_count"]
    curr_app.orchestrator_api.increase_label_change_count_since_last_train(workspace_id, category_id,
                                                                           changed_elements_count)
    res = {'canceled': 'OK'}
    return jsonify(res)



"""
Information on enriched tokens in a specific subset of elements, used for visualization.
"""


@main_blueprint.route("/workspace/<workspace_id>/labeled_info_gain", methods=['GET'])
@login_if_required
@validate_category_id
@validate_workspace_id
def get_labeled_elements_enriched_tokens(workspace_id):
    """
    Returns tokens and bigrams that are characteristic of positively labeled elements versus negatively labeled
    elements for the category, along with weights indicating the relative significance of each token/bigram. These are
    used to visualize the characteristic vocabulary of the category, e.g. using a word cloud. The current
    implementation relies on calculating Mutual Information between the ngrams and the user labels.

    :param workspace_id:
    :request_arg category_id:
    """
    category_id = int(request.args['category_id'])
    dataset_name = curr_app.orchestrator_api.get_dataset_name(workspace_id)
    elements = curr_app.orchestrator_api.get_all_labeled_text_elements(workspace_id, dataset_name, category_id)
    res = dict()
    if elements and len(elements) > 0:
        boolean_labels = [element.category_to_label[category_id].label == LABEL_POSITIVE for element in elements]
        res['info_gain'] = extract_enriched_ngrams_and_weights_list(elements, boolean_labels)
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/predictions_info_gain", methods=['GET'])
@login_if_required
@validate_category_id
@validate_workspace_id
@cross_origin()
def get_predictions_enriched_tokens(workspace_id):
    """
    Returns tokens and bigrams that are characteristic of positively predicted elements versus negatively predicted
    elements by the latest model for the category, along with weights indicating the relative significance of each
    token/bigram. These are used to visualize the characteristic vocabulary of the model predictions, e.g. using a
    word cloud. The current implementation relies on calculating Mutual Information between the ngrams and the model
    predictions.

    :param workspace_id:
    :request_arg category_id:
    """
    res = dict()

    category_id = int(request.args['category_id'])
    if len(curr_app.orchestrator_api.get_all_iterations_by_status(workspace_id, category_id,
                                                                  IterationStatus.READY)) == 0:
        res['info_gain'] = []
        return jsonify(res)

    true_elements = curr_app.orchestrator_api.get_elements_by_prediction(
        workspace_id, category_id, LABEL_POSITIVE, sample_size=1000, shuffle=True, remove_duplicates=False)
    false_elements = curr_app.orchestrator_api.get_elements_by_prediction(
        workspace_id, category_id, LABEL_NEGATIVE, sample_size=1000, shuffle=True, remove_duplicates=False)

    elements = true_elements + false_elements
    boolean_labels = [LABEL_POSITIVE] * len(true_elements) + [LABEL_NEGATIVE] * len(false_elements)

    res['info_gain'] = extract_enriched_ngrams_and_weights_list(elements, boolean_labels)
    return jsonify(res)


@main_blueprint.route("/feature_flags", methods=['GET'])
def get_feature_flags():
    """Returns the value of the feature flags

    Feature flags are a subset of config["CONFIGURATION"].
    """

    res =  {
        "login_required": curr_app.config['CONFIGURATION'].login_required,
        "main_panel_elements_per_page": curr_app.config['CONFIGURATION'].main_panel_elements_per_page,
        "sidebar_panel_elements_per_page": curr_app.config['CONFIGURATION'].sidebar_panel_elements_per_page,
        "right_to_left": curr_app.config['CONFIGURATION'].language.right_to_left
    }
    logging.debug(f'Feature flags are: {res}')
    return jsonify(res) 
    

@main_blueprint.route("/version", methods=['GET'])
def get_git_describe():
    """Retrieves the system version 

    Git version is given priority, thus if git is installed 
    in the system and a .git folder is present, the output
    of 'git describe' is returned. If that fails, the package
    version is returned. If that fails too, the string 'not
    available' is returned instead.

    Returns:
        an object with version and source fields
    """
    try:
        import git
        repo = git.repo.Repo(os.path.abspath(os.path.join(__file__, os.pardir, os.pardir)))
        version = repo.git.describe(tags=True)
        source = 'git'
    except:
        try:
            version = pkg_resources.require("label-sleuth")[0].version
            source = 'pypi'
        except:
            version = 'Not available'
            source = None
            logging.warning(f'Could not get Label Sleuth version information')

    return {'version': version, 'source': source}