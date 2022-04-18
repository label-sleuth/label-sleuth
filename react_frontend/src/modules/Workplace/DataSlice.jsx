import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const initialState = {
    workspace: "fairytale-bias-val-split",
    document: "storybook_sentence_val_split-assipattle_and_the_mester_stoorworm",
    elements: [],
    categories: [],
    curCategory: null,
    ready: false
}

export const fetchElements = createAsyncThunk('workspace/fetchElements', async (request, { getState }) => {

    const state = getState()

    var url = new URL(`https://sleuth-ui-backend-dev.ris2-debater-event.us-east.containers.appdomain.cloud/workspace/${state.workspace.workspace}/document/${state.workspace.document}`)

    const data = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer Via95malVX383mcS022JfIKAksd9admCVJASD94123FPQva943q'
        },
        method: "GET"
    }).then( response => response.json())

    return data
})

export const fetchCategories = createAsyncThunk('workspace/get_all_categories', async (request, { getState }) => {

    const state = getState()

    var url = new URL(`https://sleuth-ui-backend-dev.ris2-debater-event.us-east.containers.appdomain.cloud/workspace/${state.workspace.workspace}/categories`)

    const data = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer Via95malVX383mcS022JfIKAksd9admCVJASD94123FPQva943q'
        },
        method: "GET"
    }).then( response => response.json())

    return data
})

export const setElementLabel = createAsyncThunk('workspace/set_element_label', async (request, { getState }) => {

    const state = getState()

    const { element_id, label } = request

    console.log(`element id: ${element_id}, label: ${label}`)

    var url = new URL(`https://sleuth-ui-backend-dev.ris2-debater-event.us-east.containers.appdomain.cloud/workspace/${state.workspace.workspace}/element/${element_id}?category_name=${state.workspace.curCategory}&value=`)

    const data = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer Via95malVX383mcS022JfIKAksd9admCVJASD94123FPQva943q'
        },
        body: JSON.stringify({
            'category_name': state.workspace.curCategory,
            'value': label,
            'update_counter': true
        }),
        method: "PUT"
    }).then( response => response.json())

    return data

})

const DataSlice = createSlice({
    name: "workspace",
    initialState,
    reducers: {
        updateCurCategory(state, action) {
            const c = action.payload
            console.log(`category: ${c}`)
            return {
                ...state,
                curCategory: c
            }
        }
    },
    extraReducers: {
        [fetchElements.fulfilled]: (state, action) => {
            const data = action.payload
            console.log(data)

            return {
                ...state,
                elements: data['elements'],
                ready: true
            }
        },
        [fetchCategories.fulfilled]: (state, action) => {
            const data = action.payload
            return {
                ...state,
                categories: data['categories']
            }
        }
    }
})

export default DataSlice.reducer;
export const { updateCurCategory } = DataSlice.actions;