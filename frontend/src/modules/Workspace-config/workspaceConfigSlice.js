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

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { GET_WORKSPACES_API, GET_DATASETS_API, CREATE_WORKSPACE_API, ADD_DOCUMENTS_API } from "../../config"
import { client } from '../../api/client'
import axios from 'axios'
import { FAILED_LOAD_DOCS_TO_DATASET, DOC_ALREADY_EXISTS } from '../../const'

const token = localStorage.getItem('token')

const initialState = {
  workspaces: [],
  active_workspace: '',
  datasets: [],
  dataset: '',
  loading: false,
  isDocumentAdded: false,
  uploadingDataset: false,
  errorMessage: "",
}

const BASE_URL = process.env.REACT_APP_API_URL
const getWorkspaces_url = `${BASE_URL}/${GET_WORKSPACES_API}`
const getDatasets_url = `${BASE_URL}/${GET_DATASETS_API}`
const createWorkset_url = `${BASE_URL}/${CREATE_WORKSPACE_API}`

export const getWorkspaces = createAsyncThunk('workspaces/getWorkspaces', async () => {
  const { data } = await client.get(getWorkspaces_url)
  return data
})

export const createWorkspace = createAsyncThunk('workspaces/createWorkspace', async (params) => {
  const { data } = await client.post(createWorkset_url, params)
  return data
})

export const addDocuments = createAsyncThunk(`workspaces/getDatasets/dataset_name/addDocuments`, async (formData, { rejectWithValue }) => {
  try {
    const dataset_name = formData.get('dataset_name')
    let headers = {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${token}`
    }
    const { data } = await axios.post(`${getDatasets_url}/${dataset_name}/${ADD_DOCUMENTS_API}`, formData, { headers });
    return data

  } catch (err) {
    let errorMessage = ""
    const responseCode = err.response.data.error_code

    if (responseCode == 409) {
      errorMessage = DOC_ALREADY_EXISTS
    }
    else if (responseCode == 400) {
      errorMessage = FAILED_LOAD_DOCS_TO_DATASET
    }
    return rejectWithValue(errorMessage)
  }
}
)

export const getDatasets = createAsyncThunk('workspaces/getDatasets', async () => {
  const { data } = await client.get(getDatasets_url)
  return data
})

export const workspacesSlice = createSlice({
  name: 'workspaces',
  initialState,
  reducers: {
    setActiveWorkspace: (state, action) => {
      state.active_workspace = action.payload
    },
    clearState: (state) => {
      state.errorMessage = ""
      state.isDocumentAdded = false
      state.uploadingDataset = false
    },
  },
  extraReducers: {
    [getWorkspaces.pending]: (state) => {
      state.loading = true
    },
    [getWorkspaces.fulfilled]: (state, { payload }) => {
      state.loading = false
      state.workspaces = payload.workspaces
    },
    [getWorkspaces.rejected]: (state) => {
      state.loading = false
    },
    [getDatasets.pending]: (state) => {
      state.loading = true
    },
    [getDatasets.fulfilled]: (state, { payload }) => {
      state.loading = false
      state.datasets = payload.datasets
    },
    [getDatasets.rejected]: (state) => {
      state.loading = false
    },
    [createWorkspace.rejected]: (state) => {
      state.loading = false
    },
    [createWorkspace.pending]: (state) => {
      state.loading = true
    },
    [createWorkspace.fulfilled]: (state, { payload }) => {
      state.loading = false
      state.workspace = payload.workspace
    },
    [addDocuments.rejected]: (state, action) => {
      state.uploadingDataset = false
      state.errorMessage = action.payload
    },
    [addDocuments.pending]: (state) => {
      state.uploadingDataset = true
    },
    [addDocuments.fulfilled]: (state) => {
      state.uploadingDataset = false
      state.isDocumentAdded = true
    },

  },
})
export const {
  setActiveWorkspace,
  clearState,
} = workspacesSlice.actions

export const workspacesReducer = workspacesSlice.reducer