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

// The base URL is set to an empty string if the environment variable hasn't been set
export const BASE_URL = process.env.REACT_APP_API_URL === null || process.env.REACT_APP_API_URL === undefined ? '' : process.env.REACT_APP_API_URL
export const GET_WORKSPACES_API = 'workspaces'
export const GET_DATASETS_API = 'datasets'
export const WORKSPACE_API = 'workspace'
export const CREATE_WORKSPACE_API = 'workspace'
export const ADD_DOCUMENTS_API = 'add_documents'
export const AUTHENTICATE_API = 'users/authenticate' 
export const DOWNLOAD_LABELS_API = 'export_labels'
export const UPLOAD_LABELS_API = 'import_labels'
export const APP_NAME = 'Label Sleuth'

export const LOGIN_PATH = '/login'
export const WORKSPACE_CONFIG_PATH = '/workspace_config'
export const WORKSPACE_PATH = '/workspace'

export const AUTH_ENABLED = process.env.REACT_APP_AUTH_ENABLED === 'true' || false