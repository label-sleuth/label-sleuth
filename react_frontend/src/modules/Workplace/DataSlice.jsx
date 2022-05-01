import { CoPresentOutlined } from '@mui/icons-material'
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { BASE_URL,  WORKSPACE_API  } from "../../config_cloud"

const initialState = {
    workspace: "CC1",
    curDocId: 0,
    curDocName: "",
    documents: [],
    elements: [],
    categories: [],
    curCategory: null,
    ready: false,
    num_cur_batch: 0,
    elementsToLabel: [],
    focusedIndex: 0,
    focusedState: [],
    labelState: [],
    searchResult: [],
    model_version: 0,
    indexPrediction: 0,
    predictionForDocCat: []
}

const token = "Via95malVX383mcS022JfIKAksd9admCVJASD94123FPQva943q"
const getWorkspace_url = `${BASE_URL}/${WORKSPACE_API}`

export const fetchDocuments = createAsyncThunk('workspace/fetchDocuments', async (request, { getState }) => {

    const state = getState()

    var url = new URL(`${getWorkspace_url}/${state.workspace.workspace}/documents`)

    const data = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        method: "GET"
    }).then( response => response.json())

    return data
})

export const getElementToLabel = createAsyncThunk('workspace/getElementToLabel', async (request, { getState }) => {

    const state = getState()

    var url = new URL(`${getWorkspace_url}/${state.workspace.workspace}/active_learning?category_name=${state.workspace.curCategory}`)

    const data = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        method: "GET"
    }).then( response => response.json())

    return data
})



export const getPositiveElementForCategory = createAsyncThunk('workspace/getPositiveElementForCategory', async (request, { getState }) => {

    const state = getState()

    var url = new URL(`${getWorkspace_url}/${state.workspace.workspace}/positive_elements?category_name=${state.workspace.curCategory}`)

    const data = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        method: "GET"
    }).then( response => response.json())

    return data
})

export const searchKeywords = createAsyncThunk('workspace/searchKeywords', async (request, { getState }) => {
    const state = getState()

    const { keyword } = request
    console.log(`searchKeywords called, key: `, keyword)
    
    var url = new URL(`https://sleuth-ui-backend-dev.ris2-debater-event.us-east.containers.appdomain.cloud//workspace/${state.workspace.workspace}/query?qry_string=${keyword}&category_name=${state.workspace.curCategory}&sample_start_idx=0`)

    const data = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer Via95malVX383mcS022JfIKAksd9admCVJASD94123FPQva943q'
        },
        method: "GET"
    }).then( response => response.json())

    return data
})

export const fetchNextDocElements = createAsyncThunk('workspace/fetchNextDoc', async (request, { getState }) => {

    const state = getState()

    const curDocument = state.workspace.documents[state.workspace.curDocId+1]['document_id']

    var url = new URL(`${getWorkspace_url}/${state.workspace.workspace}/document/${curDocument}`)

    const data = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        method: "GET"
    }).then( response => response.json())

    return data
})

export const fetchPrevDocElements = createAsyncThunk('workspace/fetchPrevDoc', async (request, { getState }) => {

    const state = getState()

    const curDocument = state.workspace.documents[state.workspace.curDocId-1]['document_id']

    var url = new URL(`${getWorkspace_url}/${state.workspace.workspace}/document/${curDocument}`)

    const data = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        method: "GET"
    }).then( response => response.json())

    return data
})

export const fetchElements = createAsyncThunk('workspace/fetchElements', async (request, { getState }) => {

    const state = getState()

    const curDocument = state.workspace.documents[state.workspace.curDocId]['document_id']

    var url = new URL(`${getWorkspace_url}/${state.workspace.workspace}/document/${curDocument}`)

    const data = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        method: "GET"
    }).then( response => response.json())

    return data
})

export const fetchCertainDocument = createAsyncThunk('workspace/fetchCertainDocument', async (request, { getState }) => {

    const state = getState()

    const { docid, eid } = request

    console.log(`call fetchCertainDocument, eid: ${eid}`)

    var url = new URL(`${getWorkspace_url}/${state.workspace.workspace}/document/${docid}`)

    console.log(`Here!`)

    const data = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        method: "GET"
    }).then( response => {
        var data = response.json()
        data['eid'] = eid
        return data
    })

    return { data, eid }
})

export const fetchCategories = createAsyncThunk('workspace/get_all_categories', async (request, { getState }) => {

    const state = getState()

    var url = new URL(`${getWorkspace_url}/${state.workspace.workspace}/categories`)

    const data = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        method: "GET"
    }).then( response => response.json())

    return data
})

export const checkModelUpdate = createAsyncThunk('workspace/check_model_update', async (request, { getState }) => {

    const state = getState()

    var url = new URL(`${getWorkspace_url}/${state.workspace.workspace}/models?category_name=${state.workspace.curCategory}`)

    const data = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        method: "GET"
    }).then( response => response.json())

    return data

})

export const setElementLabel = createAsyncThunk('workspace/set_element_label', async (request, { getState }) => {

    const state = getState()

    const { element_id, label, docid } = request

    var url = new URL(`${getWorkspace_url}/${state.workspace.workspace}/element/${element_id}?category_name=${state.workspace.curCategory}`)

    const data = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
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
        nextPrediction(state, action) {
            const pred_index = state.indexPrediction
            if (pred_index < state.elementsToLabel.length-1) {
                return {
                    ...state,
                    indexPrediction: pred_index+1
                }
            } else {
                return {
                    ...state
                }
            }
        },
        prevPrediction(state, action) {
            const pred_index = state.indexPrediction
            if (pred_index > 0) {
                return {
                    ...state,
                    indexPrediction: pred_index-1
                }
            } else {
                return {
                    ...state
                }
            }
        },
        updateCurCategory(state, action) {
            const c = action.payload
            console.log(`category: ${c}`)
            return {
                ...state,
                curCategory: c
            }
        },
        setFocusedState(state, action) {
            const id = action.payload

            var initialFocusedState = {}

            for (var i = 0; i < state['elements'].length; i++) {
                const new_key = 'L' + i
                initialFocusedState['L'+i] = {...initialFocusedState, new_key: false }
            }

            initialFocusedState['L'+id] = true

            return {
                ...state,
                focusedState: initialFocusedState,
                focusedIndex: id
            }
        },
        setLabelState(state, action) {
            const new_labeled_state = action.payload

            return {
                ...state,
                labelState: new_labeled_state
            }
        },
    },
    extraReducers: {
        [fetchElements.fulfilled]: (state, action) => {
            const data = action.payload
            console.log(data)

            var initialFocusedState = {}

            for (var i = 0; i < data['elements'].length; i++) {
                initialFocusedState['L'+i] = false
            }

            initialFocusedState['L0'] = true

            var initialLabelState = {}

            for (var i = 0; i < data['elements'].length; i++) {
                initialLabelState['L'+i] = ""
            }

            return {
                ...state,
                elements: data['elements'],
                focusedState: initialFocusedState,
                focusedIndex: 0,
                labelState: initialLabelState,
                ready: true
            }
        },
        [fetchCategories.fulfilled]: (state, action) => {
            const data = action.payload
            return {
                ...state,
                categories: data['categories']
            }
        },
        [fetchDocuments.fulfilled]: (state, action) => {
            const data = action.payload
            return {
                ...state,
                documents: data['documents'],
                curDocName: data['documents'][0]['document_id'],
                curDocId: 0
            }
        },
        [searchKeywords.fulfilled]: (state, action) => {
            const data = action.payload

            return {
                ...state,
                searchResult: data.elements
            }
        },
        [getPositiveElementForCategory.fulfilled]: (state, action) => {
            const data = action.payload

            // var doc_elements = [ ... state.elements ]

            var predictionForDocCat = Array(state.elements.length-1).fill(false)

            console.log(`positive elements: `, data['positive_elements'])

            data['positive_elements'].map((e, i) => {
                const docid = e['docid']
                var eids = e['id'].split('-')
                const eid = parseInt(eids[eids.length-1])

                if(docid == state.curDocName) {
                    // console.log(`eid: ${eid}, i: ${i}`)

                    predictionForDocCat[eid] = true
                }
            })

            return {
                ...state,
                predictionForDocCat: predictionForDocCat
            }
        },
        [fetchNextDocElements.fulfilled]: (state, action) => {
            const data = action.payload

            console.log(data)

            var initialFocusedState = {}

            for (var i = 0; i < data['elements'].length; i++) {
                initialFocusedState['L'+i] = false
            }

            initialFocusedState['L0'] = true

            var initialLabelState = {}

            for (var i = 0; i < data['elements'].length; i++) {
                initialLabelState['L'+i] = ""
            }

            return {
                ...state,
                elements: data['elements'],
                curDocId: state.curDocId+1,
                curDocName: state['documents'][state.curDocId+1]['document_id'],
                focusedState: initialFocusedState,
                focusedIndex: 0,
                labelState: initialLabelState,
                ready: true
            }
        },
        [fetchPrevDocElements.fulfilled]: (state, action) => {
            const data = action.payload

            var initialFocusedState = {}

            for (var i = 0; i < data['elements'].length; i++) {
                initialFocusedState['L'+i] = false
            }

            initialFocusedState['L0'] = true

            var initialLabelState = {}

            for (var i = 0; i < data['elements'].length; i++) {
                initialLabelState['L'+i] = ""
            }

            return {
                ...state,
                elements: data['elements'],
                curDocId: state.curDocId-1,
                curDocName: state['documents'][state.curDocId-1]['document_id'],
                focusedState: initialFocusedState,
                focusedIndex: 0,
                labelState: initialLabelState,
                ready: true
            }
        },
        [setElementLabel.fulfilled]: (state, action) => {
            const data = action.payload

            console.log(`setElementLabel: `, data)

            return {
                ...state,
                num_cur_batch: state.num_cur_batch == 10 ? 0 : state.num_cur_batch + 1,
                ready: true
            }
        },
        [getElementToLabel.fulfilled]: (state, action) => {

            const data = action.payload

            console.log(`getElementToLabel: `, data)

            return {
                ...state,
                elementsToLabel: data['elements'],
                ready: true
            }
        },
        [checkModelUpdate.fulfilled]: (state, action) => {

            const data = action.payload

            const model_num = data['models'].length

            const latest_model_version = data['models'][model_num-1]['iteration']

            return {
                ...state,
                model_version: latest_model_version
            }

        },
        [fetchCertainDocument.fulfilled]: (state, action) => {

            const response = action.payload
            const data = response['data']
            const eid = response['eid']

            var initialFocusedState = {}

            for (var i = 0; i < data['elements'].length; i++) {
                initialFocusedState['L'+i] = false
            }

            console.log(`data['eid]: ${eid}`)

            initialFocusedState['L'+eid] = true

            var initialLabelState = {}

            for (var i = 0; i < data['elements'].length; i++) {
                initialLabelState['L'+i] = ""
            }

            var DocId = -1


            state.documents.map((d, i) => {
                const curDocument = data['elements'][0]['docid']
                if (d['document_id'] == curDocument) {
                    DocId = i
                    return
                }
            })



            if (DocId == -1) {
                console.log(`No Doc found with docid: ${data['elements'][0]['docid']}`)
            }

            console.log(`elements: `, data['elements'])

            return {
                ...state,
                elements: data['elements'],
                curDocId: DocId,
                curDocName: state['documents'][DocId]['document_id'],
                focusedState: initialFocusedState,
                focusedIndex: 0,
                labelState: initialLabelState,
                ready: true
            }
        },
    }
})

export default DataSlice.reducer;
export const { updateCurCategory, prevPrediction, nextPrediction, setFocusedState, setLabelState } = DataSlice.actions;