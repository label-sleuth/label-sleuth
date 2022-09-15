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

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  BASE_URL,
  GET_WORKSPACES_API,
  GET_DATASETS_API,
  CREATE_WORKSPACE_API,
  ADD_DOCUMENTS_API,
} from "../../config";
import { client } from "../../api/client";

const initialState = {
  document: {},
  isWorkspaceAdded: false,
  workspaces: [],
  active_workspace: "",
  datasets: [],
  dataset: "",
  loading: false,
  isDocumentAdded: false,
  uploadingDataset: false,
};

const getWorkspaces_url = `${BASE_URL}/${GET_WORKSPACES_API}`;
const getDatasets_url = `${BASE_URL}/${GET_DATASETS_API}`;
const createWorkset_url = `${BASE_URL}/${CREATE_WORKSPACE_API}`;

export const getWorkspaces = createAsyncThunk(
  "workspaces/getWorkspaces",
  async () => {
    const { data } = await client.get(getWorkspaces_url);
    return data;
  }
);

export const createWorkspace = createAsyncThunk(
  `workspaces/createWorkspace`,
  async (body) => {
    const { data } = await client.post(createWorkset_url, body);
    return data;
  }
);

export const addDocuments = createAsyncThunk(
  `workspaces/getDatasets/dataset_name/addDocuments`,
  async (formData) => {
    const dataset_name = formData.get("dataset_name");
    const url = `${getDatasets_url}/${dataset_name}/${ADD_DOCUMENTS_API}`
    const { data } = await client.post(url, formData, {stringifyBody: false, omitContentType: true})
    return data;
  }
);

export const getDatasets = createAsyncThunk(
  "workspaces/getDatasets",
  async () => {
    const { data } = await client.get(getDatasets_url);
    return data;
  }
);

export const workspacesSlice = createSlice({
  name: "workspaces",
  initialState,
  reducers: {
    setActiveWorkspace: (state, action) => {
      state.active_workspace = action.payload;
    },
    clearState: (state) => {
      state.isDocumentAdded = false;
      state.isWorkspaceAdded = false;
    },
  },
  extraReducers: {
    [getWorkspaces.pending]: (state) => {
      state.loading = true;
    },
    [getWorkspaces.fulfilled]: (state, { payload }) => {
      state.loading = false;
      state.workspaces = payload.workspaces;
    },
    [getWorkspaces.rejected]: (state) => {
      state.loading = false;
    },
    [getDatasets.pending]: (state) => {
      state.loading = true;
    },
    [getDatasets.fulfilled]: (state, { payload }) => {
      state.loading = false;
      state.datasets = payload.datasets;
    },
    [getDatasets.rejected]: (state) => {
      state.loading = false;
    },
    [createWorkspace.rejected]: (state, action) => {
      state.loading = false;
    },
    [createWorkspace.pending]: (state) => {
      state.loading = true;
    },
    [createWorkspace.fulfilled]: (state, { payload }) => {
      state.loading = false;
      state.isWorkspaceAdded = true;
    },
    [addDocuments.rejected]: (state, action) => {
      state.uploadingDataset = false;
    },
    [addDocuments.pending]: (state) => {
      state.uploadingDataset = true;
    },
    [addDocuments.fulfilled]: (state, action) => {
      state.document = action.payload;
      state.uploadingDataset = false;
      state.isDocumentAdded = true;
    },
  },
});
export const { setActiveWorkspace, clearState } = workspacesSlice.actions;

export const workspacesReducer = workspacesSlice.reducer;
