/*
    Copyright (c) 2022 IBM Corp.
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/
import { getOrdinalSuffix } from "./utils/utils";

// Tooltip messages
// *******************
// Sidebar tooltip messages
export const SEARCH_ALL_DOCS_TOOLTIP_MSG = "Search all documents";
export const NEXT_TO_LABEL_TOOLTIP_MSG = "Label next";
export const LABEL_NEXT_HELPER_MSG = "The system suggests to label these elements next to best assist it to improve";
export const POSITIVE_PRED_TOOLTIP_MSG = "Positive predictions";
export const DISAGREEMENTS_TOOLTIP_MSG = "label-prediction disagreements";
export const SUSPICIOUS_LABELS_TOOLTIP_MSG = "Suspicious labels";
export const CONTRADICTING_LABELS_TOOLTIP_MSG = "Contradicting labels";
export const EVALUATION_TOOLTIP_MSG = "Evaluate model";

export const PREV_DOC_TOOLTIP_MSG = "Go to previous document";
export const NEXT_DOC_TOOLTIP_MSG = "Go to next document";
export const LOGOUT_TOOLTIP_MSG = "Logout";
export const GO_TO_WORKSPACE_CONFIG_TOOLTIP_MSG = "Go to workspace configuration";
export const CREATE_NEW_CATEGORY_TOOLTIP_MSG = "Create new category";
export const EDIT_CATEGORY_TOOLTIP_MSG = "Edit category";
export const DELETE_CATEGORY_TOOLTIP_MSG = "Delete category";
// *******************

// Evaluation panel messages
export const START_EVALUATION_MSG = "Click on Start to start the precision evaluation process";
export const EVALUATION_IN_PROGRESS_MSG =
  "Label all the elements. Once its done, click on Submit to get the precision score.";
export const WAIT_NEW_MODEL_MSG = "Please wait till the next model is available to start the evaluation";
export const PRECISION_RESULT_MSG = (precision: number, currentModelVersion: number, scoreModelVersion: number) =>
  `
    The precision of the ${scoreModelVersion}${getOrdinalSuffix(scoreModelVersion)} model is ${precision}%.` +
  `${
    scoreModelVersion !== currentModelVersion
      ? ` Current model is ${currentModelVersion}${getOrdinalSuffix(
          currentModelVersion
        )}. Start a new precision evaluation to get the updated evaluation.`
      : ""
  }`;

export const NO_MODEL_AVAILABLE_MSG = "not available yet";
export const CREATE_NEW_CATEGORY_MODAL_MSG = "Create a new category";
export const CREATE_NEW_CATEGORY_PLACEHOLDER_MSG = "New category name";
export const UPLOAD_NEW_DATASET_MSG = "Upload new data";
export const UPLOAD_NEW_DATASET_NAME_PLACEHOLER_MSG = "Choose or set name";
export const UPLOAD_NEW_DATASET_FILE_HELPER_MSG = `The csv file must have a header line (of "text" and optional "document_id")`;
export const UPLOAD_DOC_WAIT_MESSAGE = `Please wait while your documents are uploaded...`;
export const UPLOAD_LABELS_WAIT_MESSAGE = `Please wait while your labels are uploaded...`;
export const NEW_WORKSPACE_NAME_MSG = "Name your new workspace";
export const NEW_WORKSPACE_NAME_PLACEHOLER_MSG = "e.g., my_new_workspace";
export const LABEL_SLEUTH_SHORT_DESC = "Quickly create a text classifier";
export const ALL_POSITIVE_LABELS_TOOLTIP_MSG = "All positive labels";
export const DOC_ALREADY_EXISTS = "Document already exists";
export const SERVER_ERROR_500 = "An error occurred and your request could not be completed. Please try again.";
export const FAILED_LOAD_DOCS_TO_DATASET = `An error occurred while uploading the dataset. Make sure your CSV file is well-formatted and contains the column "text" and optionally a column "document_id".`;
export const FILL_REQUIRED_FIELDS = "Please fill out all the required fields!";
export const NEW_DATA_CREATED = `The new dataset has been created`;
export const SELECT_WORKSPACE = `Please select a workspace!`;
export const NEXT_MODEL_TRAINING_MSG = "Training a new model";
export const NEXT_ZERO_SHOT_MODEL_TRAINING_MSG = "Training a new zero shot model";
export const newDataCreatedMessage = (name: string, numDocs: number, numsentences: number) =>
  `The new dataset ${name} has been created with ${numDocs} documents and ${numsentences} text entries.`;
export const WRONG_INPUT_NAME_LENGTH = "Name may be max 30 characters long";
export const WRONG_INPUT_NAME_BAD_CHARACTER_NO_SPACES = `Name may only contain English characters, digits and underscores`;
export const WRONG_INPUT_NAME_BAD_CHARACTER = `Name may only contain English characters, digits, underscores and spaces`;
export const REGEX_LETTER_NUMBERS_UNDERSCORE = /^[a-zA-Z0-9_]*$/;
export const REGEX_LETTER_NUMBERS_UNDERSCORE_SPACES = /^[a-zA-Z0-9_ ]*$/;

export const RIGHT_DRAWER_INITIAL_WIDTH = 350;
export const RIGHT_DRAWER_MIN_WIDTH = 300;
export const RIGHT_DRAWER_MAX_WIDTH = 800;
export const LEFT_DRAWER_WIDTH = 300;
export const ACTIONS_DRAWER_WIDTH = 50;
export const APPBAR_HEIGHT = 80;

export const panelIds = {
  MAIN_PANEL: "__MAIN_PANEL",
  LABEL_NEXT: "__LABEL_NEXT",
  SEARCH: "__SEARCH",
  POSITIVE_LABELS: "__ALL_POSITIVE_LABELS",
  CONTRADICTING_LABELS: "__CONTRADICTING_LABELS",
  SUSPICIOUS_LABELS: "__SUSPICIOUS_LABELS",
  POSITIVE_PREDICTIONS: "__POSITIVE_PREDICTIONS",
  EVALUATION: "__EVALUATION",
  NOT_SET: "",
};

export enum PanelIdsEnum {
  MAIN_PANEL = "__MAIN_PANEL",
  LABEL_NEXT = "__LABEL_NEXT",
  SEARCH = "__SEARCH",
  POSITIVE_LABELS = "__ALL_POSITIVE_LABELS",
  CONTRADICTING_LABELS = "__CONTRADICTING_LABELS",
  SUSPICIOUS_LABELS = "__SUSPICIOUS_LABELS",
  POSITIVE_PREDICTIONS = "__POSITIVE_PREDICTIONS",
  EVALUATION = "__EVALUATION",
  NOT_SET = "",
}

export const focusNextOnLabelingPanels = Object.values(PanelIdsEnum);

export const KeyboardKeysEnum = {
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  ARROW_UP: "ArrowUp",
  ENTER: "Enter",
  SHIFT: "Shift",
  QUESTION_MARK: "?",
};

export enum LabelTypesEnum {
  POS = "pos",
  NEG = "neg",
  NONE = "none",
}

export enum LabelActionsEnum {
  POS = "pos",
  NEG = "neg",
}

export const BOMCharacter = '\uFEFF'