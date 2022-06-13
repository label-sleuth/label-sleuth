import getpass
import logging
import os
import tempfile
import traceback

from concurrent.futures.thread import ThreadPoolExecutor
from io import BytesIO, StringIO

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s')

import dacite
import pandas as pd

from flask import Flask, jsonify, request, send_file, make_response, send_from_directory, current_app, Blueprint
from flask_cors import CORS, cross_origin

from label_sleuth.app_utils import elements_back_to_front, extract_iteration_information_list, \
    extract_enriched_ngrams_and_weights_list, get_element
from label_sleuth.authentication import authenticate_response, login_if_required, verify_password
from label_sleuth.active_learning.core.active_learning_factory import ActiveLearningFactory
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


def create_app(config, output_dir) -> Flask:
    app = Flask(__name__, static_url_path='', static_folder='./build')
    CORS(app)
    app.config['CORS_HEADERS'] = 'Content-Type'
    app.config["CONFIGURATION"] = config
    app.config["output_dir"] = output_dir
    app.users = {x['username']: dacite.from_dict(data_class=User, data=x) for x in app.config["CONFIGURATION"].users}
    app.tokens = [user.token for user in app.users.values()]
    app.orchestrator_api = OrchestratorApi(OrchestratorStateApi(os.path.join(output_dir, "workspaces")),
                                           FileBasedDataAccess(output_dir),
                                           ActiveLearningFactory(),
                                           ModelFactory(os.path.join(output_dir, "models"),
                                                        ModelsBackgroundJobsManager()),
                                           app.config["CONFIGURATION"])
    app.register_blueprint(main_blueprint)
    return app


def start_server(app, port=8000):
    disable_html_printouts = False
    if disable_html_printouts:
        logging.getLogger('werkzeug').disabled = True
        os.environ['WERKZEUG_RUN_MAIN'] = True

    from waitress import serve
    serve(app, port=port, threads=20)  # to enable running on a remote machine


@main_blueprint.route("/", defaults={'path': ''})
def serve(path):
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
    Get all existing datasets
    :return array of dataset ids as strings:
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
    Specifically, the file must include a 'text' column, and may optionally include a 'doc_id' column as well as
    metadata columns starting with the 'metadata_' prefix.
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
                        "error_code": 409})
    except Exception:
        logging.exception(f"failed to load or add documents to dataset '{dataset_name}'")
        return jsonify({"dataset_name": dataset_name, "error": traceback.format_exc(), "error_code": 400})
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
    Create workspace
    :param workspace_id
    :param dataset_name
    :return workspace_id, dataset_name:
    """
    post_data = request.get_json(force=True)
    workspace_id = post_data["workspace_id"]
    dataset_name = post_data["dataset_id"]

    if current_app.orchestrator_api.workspace_exists(workspace_id):
        raise Exception(f"workspace '{workspace_id}' already exists")
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
    Get all existing workspaces
    """
    res = {'workspaces': current_app.orchestrator_api.list_workspaces()}
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>", methods=['DELETE'])
@login_if_required
def delete_workspace(workspace_id):
    """
    This call permanently deletes all data associated with the workspaces, including all the categories, user labels
    and models.
    """
    current_app.orchestrator_api.delete_workspace(workspace_id)
    return jsonify({'workspace_id': workspace_id})


@main_blueprint.route("/workspace/<workspace_id>", methods=['GET'])
@login_if_required
def get_workspace_info(workspace_id):
    """
    Get workspace information
    :param workspace_id
    :return workspace_id, dataset_name, array of all document_ids, id of first document:
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
    add a new category
    :param workspace_id:
    :return success:
    """
    post_data = request.get_json(force=True)
    post_data['id'] = post_data["category_name"]  # TODO old frontend expects the category name to be in id, remove after moving to new frontend
    current_app.orchestrator_api.create_new_category(workspace_id, post_data["category_name"],
                                                     post_data["category_description"])

    res = {'category': post_data}
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/categories", methods=['GET'])
@login_if_required
def get_all_categories(workspace_id):
    """
    Get information about all existing categories in the workspace
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
    :param category_name:
    :param category_description:
    :return success:
    """
    return "Not Implemented", 503


@main_blueprint.route("/workspace/<workspace_id>/category/<category_name>", methods=['DELETE'])
@login_if_required
def delete_category(workspace_id, category_name):
    """
    This call permanently deletes all data associated with the category, including user labels and models.
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
    get all Documents
    :param workspace_id:
    :return documents:
    """

    doc_uris = current_app.orchestrator_api.get_all_document_uris(workspace_id)
    res = {"documents":
               [{"document_id": uri} for uri in doc_uris]}  # TODO change document_id to document_uri in the ui
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/document/<document_id>", methods=['GET'])
@login_if_required
def get_document_elements(workspace_id, document_id):
    """
    get all elements in a document
    :param workspace_id:
    :param document_id: the uri of the document
    :return elements:
    """
    dataset_name = current_app.orchestrator_api.get_dataset_name(workspace_id)
    document = current_app.orchestrator_api.get_documents(workspace_id, dataset_name, [document_id])[0]
    elements = document.text_elements

    category = None
    if request.args.get('category_name'):
        category = request.args.get('category_name')
    elements_transformed = elements_back_to_front(workspace_id, elements, category)

    res = {'elements': elements_transformed}
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/document/<document_id>/positive_predictions", methods=['GET'])
@login_if_required
def get_document_positive_predictions(workspace_id, document_id):
    """
    get all elements in a document
    :param workspace_id:
    :param document_id:
    :param category_name:
    :param size:
    :param start_idx:
    :return elements filtered by whether in this document and the selected category, the prediction is positive:
    """

    size = int(request.args.get('size', 100))
    start_idx = int(request.args.get('start_idx', 0))
    category_name = request.args.get('category_name')
    if len(current_app.orchestrator_api.get_all_iterations_by_status(workspace_id, category_name,
                                                                     IterationStatus.READY)) == 0:
        elements_transformed = []
    else:
        dataset_name = current_app.orchestrator_api.get_dataset_name(workspace_id)
        document = current_app.orchestrator_api.get_documents(workspace_id, dataset_name, [document_id])[0]

        elements = document.text_elements

        predictions = [pred.label for pred in current_app.orchestrator_api.infer(workspace_id, category_name, elements)]
        positive_predicted_elements = [element for element, prediction in zip(elements, predictions)
                                       if prediction == LABEL_POSITIVE]

        elements_transformed = elements_back_to_front(workspace_id, positive_predicted_elements, category_name)
        elements_transformed = elements_transformed[start_idx: start_idx + size]
    res = {'elements': elements_transformed}
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/element/<eltid>", methods=['GET'])
@login_if_required
def get_element_by_id(workspace_id, eltid):
    category_name = request.args.get('category_name')
    return get_element(workspace_id, category_name, eltid)


@main_blueprint.route("/workspace/<workspace_id>/query", methods=['GET'])
@login_if_required
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

    resp = current_app.orchestrator_api.query(workspace_id, current_app.orchestrator_api.get_dataset_name(workspace_id),
                                              category_name, query_string, unlabeled_only=False,
                                              sample_size=sample_size, sample_start_idx=sample_start_idx,
                                              remove_duplicates=True)

    elements = resp["results"]
    elements_transformed = elements_back_to_front(workspace_id, elements, category_name)

    res = {'elements': sorted(elements_transformed, key=lambda e: e['docid']),
           'hit_count': resp["hit_count"], 'hit_count_unique': resp["hit_count_unique"]}
    return jsonify(res)


"""
Labeling-related endpoints.
"""


@main_blueprint.route('/workspace/<workspace_id>/element/<element_id>', methods=['PUT'])
@login_if_required
def set_element_label(workspace_id, element_id):
    """
    Update element label information. This endpoint either adds or removes a label for a given element, depending on
    the 'value' field in the post data.
    :param workspace_id:
    :param element_id:
    :param category_name:
    :param value:
    :param update_counter:
    :return success:
    """
    post_data = request.get_json(force=True)

    category_name = post_data["category_name"]
    value = post_data["value"]
    update_counter = post_data.get('update_counter', True)

    if value == 'none':
        current_app.orchestrator_api.\
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
        current_app.orchestrator_api.\
            set_labels(workspace_id, uri_with_updated_label,
                       apply_to_duplicate_texts=current_app.config["CONFIGURATION"].apply_labels_to_duplicate_texts,
                       update_label_counter=update_counter)

    res = {'element': get_element(workspace_id, category_name, element_id), 'workspace_id': workspace_id,
           'category_name': category_name}
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/positive_elements", methods=['GET'])
@login_if_required
def get_all_positive_labeled_elements_for_category(workspace_id):
    category = request.args.get('category_name')
    elements = current_app.orchestrator_api.\
        get_all_labeled_text_elements(workspace_id, current_app.orchestrator_api.get_dataset_name(workspace_id),
                                      category)
    positive_elements = [element for element in elements if element.category_to_label[category].label == LABEL_POSITIVE]

    elements_transformed = elements_back_to_front(workspace_id, positive_elements, category)

    res = {'positive_elements': elements_transformed}
    return jsonify(res)


@main_blueprint.route('/workspace/<workspace_id>/import_labels', methods=['POST'])
@cross_origin()
@login_if_required
def import_labels(workspace_id):
    csv_data = StringIO(request.data.decode("utf-8"))  # TODO use request.data also in load_documents()
    df = pd.read_csv(csv_data, dtype={'labels': str})
    return jsonify(current_app.orchestrator_api.import_category_labels(workspace_id, df))


@main_blueprint.route('/workspace/<workspace_id>/export_labels', methods=['GET'])
@login_if_required
def export_labels(workspace_id):
    return current_app.orchestrator_api.export_workspace_labels(workspace_id).to_csv(index=False)


"""
Models and Iterations
"""


@main_blueprint.route("/workspace/<workspace_id>/status", methods=['GET'])
@login_if_required
def get_labelling_status(workspace_id):
    """
    Once a certain amount of user labels for a given category has been reached, the get_labelling_status() call will
    trigger an iteration flow in the background. This flow includes training a model, inferring the full corpus using
    this model, choosing candidate elements for labeling using active learning, and calculating various statistics.

    :param workspace_id:
    :param category_name:
    :return empty string or model id:
    """

    category_name = request.args.get('category_name')
    dataset_name = current_app.orchestrator_api.get_dataset_name(workspace_id)
    future = executor.submit(current_app.orchestrator_api.train_if_recommended, workspace_id, category_name)

    labeling_counts = current_app.orchestrator_api.\
        get_label_counts(workspace_id, dataset_name, category_name,
                         remove_duplicates=current_app.config["CONFIGURATION"].apply_labels_to_duplicate_texts)
    progress = current_app.orchestrator_api.get_progress(workspace_id, dataset_name, category_name)

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
    :param workspace_id:
    :param category_name:
    :return array of all models sorted from oldest to newest:
    """
    category_name = request.args.get('category_name')

    iterations = current_app.orchestrator_api.get_all_iterations_for_category(workspace_id, category_name)
    res = {'models': extract_iteration_information_list(iterations)}
    return jsonify(res)


@main_blueprint.route("/workspace/<workspace_id>/active_learning", methods=['GET'])
@login_if_required
def get_elements_to_label(workspace_id):
    """
    If at least one iteration has completed for the given category, return a list of *size* elements that were
    recommended for labeling by the active learning module.
    :param workspace_id:
    :param category_name:
    :param size: the number of elements to return
    :param start_idx: get elements starting from this index (for pagination)
    :return elements IN ORDER:
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
    Used for manually triggering a new iteration.
    :param workspace_id:
    :param category_name:
    :return empty string or model id:
    """

    category_name = request.args.get('category_name')
    dataset_name = current_app.orchestrator_api.get_dataset_name(workspace_id)
    if category_name not in current_app.orchestrator_api.get_all_categories(workspace_id):
        return jsonify({
            "error": "no such category '"+(category_name if category_name
                                           else "<category not provided in category_name param>")+"'"
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
    category_name = request.args.get('category_name')
    uri_filter = request.args.get('uri_filter', None)
    iteration_index = request.args.get('iteration_index')
    dataset_name = current_app.orchestrator_api.get_dataset_name(workspace_id)
    elements = current_app.orchestrator_api.get_all_text_elements(dataset_name)
    if uri_filter is not None:
        elements = [x for x in elements if uri_filter in x.uri]
    infer_results = current_app.orchestrator_api.infer(workspace_id, category_name, elements,
                                                       iteration_index=iteration_index)
    return pd.DataFrame([{**te.__dict__, "score": pred.score, 'predicted_label': pred.label} for te, pred
                         in zip(elements, infer_results)]).to_csv(index=False)


@main_blueprint.route('/workspace/<workspace_id>/export_model', methods=['GET'])
@login_if_required
def export_model(workspace_id):
    import zipfile
    category_name = request.args.get('category_name')
    iteration_index = request.args.get('iteration_index', None)  # TODO update in UI model_id -> iteration_index
    if iteration_index is None:
        iteration = current_app.orchestrator_api.\
            get_all_iterations_by_status(workspace_id, category_name, IterationStatus.READY)[-1]
    else:
        iteration = current_app.orchestrator_api.\
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
    size = current_app.config["CONFIGURATION"].precision_evaluation_size
    category = request.args.get('category_name')
    random_state = len(current_app.orchestrator_api.get_all_iterations_for_category(workspace_id, category))
    positive_predicted_elements = current_app.orchestrator_api.\
        sample_elements_by_prediction(workspace_id, category, size, unlabeled_only=False,
                                      required_label=LABEL_POSITIVE, random_state=random_state)
    elements_transformed = elements_back_to_front(workspace_id, positive_predicted_elements, category)
    logging.info(f"sampled {len(elements_transformed)} elements for evaluation")
    res = {'elements': elements_transformed}
    return jsonify(res)


@main_blueprint.route('/workspace/<workspace_id>/estimate_precision', methods=['POST'])
@login_if_required
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
    category = request.args.get('category_name')
    elements = current_app.orchestrator_api.\
        get_all_labeled_text_elements(workspace_id, current_app.orchestrator_api.get_dataset_name(workspace_id),
                                      category)
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
    :param workspace_id:
    :param category_name:
    :return info-gain of a predictions sample
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
