import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { ADUTHENTICATE_API } from "../../config"
import { client } from '../../api/client'

const initialState = {
    username: '',
    token: '',
    loading: false,
    errorMessage: '',
    isAuthenticated: false,
}

const BASE_URL = process.env.REACT_APP_API_URL

const auth_url = `${BASE_URL}/${ADUTHENTICATE_API}`

export const getAuthenticated = createAsyncThunk('workspaces/getAuthenticated', async (params) => {
    const { data } = await client.post(auth_url, params)

    localStorage.setItem("username", data.username || "")

    if(data.token){
        localStorage.setItem("token", data.token)
    }
    console.log(data);
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
            state.isAuthenticated = true
        },
        [getAuthenticated.rejected]: (state, { error }) => {
            state.errorMessage = error.message
            state.loading = false
            state.isAuthenticated = false
        },
    },
})

export const {
    clearState
} = authenticateSlice.actions

export const authenticateReducer = authenticateSlice.reducer