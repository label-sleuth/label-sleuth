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

import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ErrorSliceState, Error } from '../global';

const initialState : ErrorSliceState = {
    error: null,
    hackyToggle: false
    
}

export const errorSlice = createSlice({
    name: 'error',
    initialState,
    reducers: {
        setError: (state, action: PayloadAction<Error>) => {
            state.error = action.payload;
            state.hackyToggle = !!!state.hackyToggle;
        },
        clearError(state, action: PayloadAction<void>) {
            state.error = null;
        },
    }
})

export const { setError, clearError } = errorSlice.actions;
export const errorReducer = errorSlice.reducer