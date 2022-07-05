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

export const SEARCH_ALL_DOCS_TOOLTIP_MSG = 'Search all documents'
export const NEXT_TO_LABEL_TOOLTIP_MSG = 'Label next' 
export const POSITIVE_PRED_TOOLTIP_MSG = 'Positive predictions' 
export const PREV_DOC_TOOLTIP_MSG = "Go to previous document"
export const NEXT_DOC_TOOLTIP_MSG = "Go to next document"
export const LOGOUT_TOOLTIP_MSG = "Logout"
export const GO_TO_WORKSPACE_CONFIG_TOOLTIP_MSG = "Go to workspace configuration"
export const NO_MODEL_AVAILABLE_MSG = "not available yet"
export const CREATE_NEW_CATEGORY_MODAL_MSG = "Create a new category"
export const CREATE_NEW_CATEGORY_TOOLTIP_MSG = "Create new category"
export const CREATE_NEW_CATEGORY_PLACEHOLDER_MSG = "New category name"
export const UPLOAD_NEW_DATASET_MSG = "Upload new data"
export const UPLOAD_NEW_DATASET_NAME_PLACEHOLER_MSG = "Choose or set name"
export const UPLOAD_NEW_DATASET_FILE_HELPER_MSG = `The csv file must have a header line (of "text" and optional "document_id")`
export const UPLOAD_DOC_WAIT_MESSAGE = `Please wait while we upload your document...` 
export const NEW_WORKSPACE_NAME_MSG = "Name your new workspace"
export const NEW_WORKSPACE_NAME_PLACEHOLER_MSG = "e.g., my_new_workspace"
export const LABEL_SLEUTH_SHORT_DESC = "Quickly create a text classifier"
export const SEARCH = 'search'
export const RCMD = 'rcmd'
export const POS_PREDICTIONS = 'Positive predictions'
export const getPosPredTooltipMessage = (categoryName) => `These are the examples the model predicts to be related to the category ${categoryName} `
export const RIGHT_DRAWER_WIDTH = 360
export const DOC_ALREADY_EXISTS = "Document already exists"
export const WORKSPACE_ALREADY_EXISTS = "Workspace already exists" 
export const SERVER_ERROR_500 = "An error occurred and your request could not be completed. Please try again." 
export const FAILED_LOAD_DOCS_TO_DATASET = `An error occurred while uploading the dataset. Make sure your CSV file is well-formatted and contains the column "text" and optionally a column "document_id".`
export const FILL_REQUIRED_FIELDS = "Please fill out all the required fields!"
export const NEW_DATA_CREATED =  `The new dataset has been created` 
export const SELECT_WORKSPACE =  `Please select a workspace!`
export const NEXT_MODEL_TRAINING_MSG = "Training a new model"
export const newDataCreatedMessage =  (name, numDocs, numsentences ) => `The new dataset ${name} has been created with ${numDocs} documents and ${numsentences} text entries.` 
export const WRONG_INPUT_NAME_LENGTH = "Name may be max 30 characters long"
export const WRONG_INPUT_NAME_BAD_CHARACTER_NO_SPACES = `Name may only contain characters, digits and underscores`
export const WRONG_INPUT_NAME_BAD_CHARACTER = `Name may only contain characters, digits, underscores and spaces`
export const REGEX_LETTER_NUMBERS_UNDERSCORE = /^[a-zA-Z0-9_]*$/
export const REGEX_LETTER_NUMBERS_UNDERSCORE_SPACES = /^[a-zA-Z0-9_ ]*$/