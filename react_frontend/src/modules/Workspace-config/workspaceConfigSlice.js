import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { BASE_URL, WORKSPACES_API } from "../../config"
import { client } from '../../api/client'

const initialState = {
  workspaces: [],
  workspace: '',
  loading: false,
}

const url = `${BASE_URL}/${WORKSPACES_API}`

export const getWorkspaces = createAsyncThunk('workspaces/getWorkspaces', async () => {
  const {data} = await client.get(url)
  return data
})

export const workspacesSlice = createSlice({
  name: 'workspaces',
  initialState,
  reducers: {
    setActiveWorspace: (state, action) => {
      state.workspace = action.payload
    }
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
  },
})
export const {
  setActiveWorspace
} = workspacesSlice.actions

export const workspacesReducer = workspacesSlice.reducer