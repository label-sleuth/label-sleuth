import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { GET_WORKSPACES_API, GET_DATASETS_API, CREATE_WORKSPACE_API, ADD_DOCUMENTS_API } from "../../config"
import { client } from '../../api/client'
import axios from 'axios'

const token = localStorage.getItem('token')

const initialState = {
  workspaces: [],
  workspace: '',
  datasets: [],
  dataset: '',
  loading: false,
  isDocumentAdded: false
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

export const addDocuments = createAsyncThunk(`workspaces/getDatasets/dataset_name/addDocuments`, async (formData) => {
  const dataset_name = formData.get('dataset_name')
  let headers = {
    'Content-Type': 'multipart/form-data',
    'Authorization': `Bearer ${token}`
  }
  const { data } = axios.post(`${getDatasets_url}/${dataset_name}/${ADD_DOCUMENTS_API}`, formData, { headers });
  return data
})

export const getDatasets = createAsyncThunk('workspaces/getDatasets', async () => {
  const { data } = await client.get(getDatasets_url)
  return data
})

export const getDatasetsAPI = createAsyncThunk('workspaces/getDatasetsAPI', async (_, thunkAPI) => {
  await client.get(getDatasets_url)
  thunkAPI.dispatch(getDatasets());
})

export const workspacesSlice = createSlice({
  name: 'workspaces',
  initialState,
  reducers: {
    setActiveWorspace: (state, action) => {
      state.workspace = action.payload
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
    [addDocuments.rejected]: (state) => {
      state.loading = false
    },
    [addDocuments.pending]: (state) => {
      state.loading = true
    },
    [addDocuments.fulfilled]: (state) => {
      state.loading = false
      state.isDocumentAdded = true
    },

  },
})
export const {
  setActiveWorspace,
} = workspacesSlice.actions

export const workspacesReducer = workspacesSlice.reducer