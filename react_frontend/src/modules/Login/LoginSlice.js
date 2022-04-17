import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { BASE_URL, ADUTHENTICATE_API } from "../../config"
import { client } from '../../api/client'

const initialState = {
    token: '',
    loading: false,
    errorMessage: ''
}

const auth_url = `${BASE_URL}/${ADUTHENTICATE_API}`

export const getAuthenticated = createAsyncThunk('workspaces/getAuthenticated', async (params) => {
    const { data } = await client.post(auth_url, params)
    return data
})


export const authenticateSlice = createSlice({
    name: 'authenticate',
    initialState,
    reducers: {      
        clearState: () => initialState
    },
    extraReducers: {
        [getAuthenticated.pending]: (state) => {
            state.loading = true
        },
        [getAuthenticated.fulfilled]: (state, { payload }) => {
            state.loading = false
            state.token = payload.token
        },
        [getAuthenticated.rejected]: (state, { error }) => {
            state.errorMessage = error.message
            state.loading = false
        },
    },
})

export const {
    clearState
  } = authenticateSlice.actions

export const authenticateReducer = authenticateSlice.reducer