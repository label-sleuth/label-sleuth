import { CoPresentOutlined, NotificationsTwoTone, SignalCellularNullSharp } from '@mui/icons-material'
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import fileDownload from 'js-file-download'
import { WORKSPACE_API  } from "../../config"

const initialState = {
    workspace: "demo-dakuo",
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
    model_version: -1,
    indexPrediction: 0,
    predictionForDocCat: [],
    modelUpdateProgress: 0,
    new_categories: [],
    modelStatus: "Not ready",
    pos_label_num: 0,
    neg_label_num: 0,
    pos_label_num_doc: 0,
    neg_label_num_doc: 0,
    training_batch: 5,
    cur_completed_id_in_batch: 0
}

//const BASE_URL = "https://sleuth-ui-backend-dev.ris2-debater-event.us-east.containers.appdomain.cloud"
// const token = localStorage.getItem('token')
const BASE_URL = process.env.REACT_APP_API_URL
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

    const curDocument = state.workspace.documents[state.workspace.curDocId]['document_id']

    //var url = new URL(`${getWorkspace_url}/${state.workspace.workspace}/positive_elements?category_name=${state.workspace.curCategory}`)

    var url = new URL(`${getWorkspace_url}/${state.workspace.workspace}/document/${curDocument}?category_name=${state.workspace.curCategory}`)

    const data = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        method: "GET"
    }).then( response => response.json())

    return data
})

export const createCategoryOnServer = createAsyncThunk('workspace/createCategoryOnServer', async (request, { getState }) => {

    const state = getState()

    const { category } = request

    console.log(`category on server: ${category}`)

    var url = new URL(`${getWorkspace_url}/${state.workspace.workspace}/category`)

    const data = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            'category_name': category,
            'category_description': "",
            'update_counter': true
        }),
        method: "POST"
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

    var url = new URL(`${getWorkspace_url}/${state.workspace.workspace}/document/${curDocument}?category_name=${state.workspace.curCategory}`)

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

    var url = new URL(`${getWorkspace_url}/${state.workspace.workspace}/document/${curDocument}?category_name=${state.workspace.curCategory}`)

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

    var url = null;

    if (state.workspace.curCategory == null) {
        url = new URL(`${getWorkspace_url}/${state.workspace.workspace}/document/${curDocument}`)
    } else {
        url = new URL(`${getWorkspace_url}/${state.workspace.workspace}/document/${curDocument}?category_name=${state.workspace.curCategory}`)
    }

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

    const { docid, eid, switchStatus } = request

    console.log(`call fetchCertainDocument, eid: ${eid}`)

    var url = new URL(`${getWorkspace_url}/${state.workspace.workspace}/document/${docid}?category_name=${state.workspace.curCategory}`)

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

    return { data, eid, switchStatus }
})

export const downloadLabeling = createAsyncThunk('workspace/downloadLabeling', async (request, { getState }) => {

    const state = getState()

    var url = new URL(`${getWorkspace_url}/${state.workspace.workspace}/export_labels`)

    const data = await fetch(url, {
        headers: {
            'Content-Type': 'text/csv;charset=UTF-8',
            'Authorization': `Bearer ${token}`
        },
        method: "GET"
    }).then( res => res.text())

    return data
})

export const labelInfoGain = createAsyncThunk('workspace/labeled_info_gain', async (request, { getState }) => {

    const state = getState()

    var url = new URL(`${getWorkspace_url}/${state.workspace.workspace}/labeled_info_gain?category_name=${state.workspace.curCategory}`)

    const data = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        method: "GET"
    }).then( response => response.json())

    return data
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

export const checkStatus = createAsyncThunk('workspace/get_labelling_status', async (request, { getState }) => {
    const state = getState()

    var url = new URL(`${getWorkspace_url}/${state.workspace.workspace}/status?category_name=${state.workspace.curCategory}`)

    const data = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        method: "GET"
    }).then( response => response.json())

    return data
})

const DataSlice = createSlice({
    name: "workspace",
    initialState,
    reducers: {
        nextPrediction(state, action) {
            console.log(`np data: `, state.elements)
            
            const pred_index = state.indexPrediction+1

            var next_index = -1

            for(var i = pred_index; i < state.elements.length; i++) {
                const model_prediction = state.elements[i]['model_predictions'][Object.keys(state.elements[i]['model_predictions'])[Object.keys(state.elements[i]['model_predictions']).length - 1]]
                if (model_prediction == 'true') {
                    next_index = i
                }
            }

            if (next_index == -1) {
                next_index = 0
            }

            return {
                ...state,
                indexPrediction: next_index
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
        createNewCategory(state, action) {
            const new_category_name = action.payload

            var cat_list = [...state.new_categories]

            console.log(`createNewCategory called`)

            if (!cat_list.includes(new_category_name)) {
                console.log(`does not contain new category`)
                cat_list.push(new_category_name)
            } else {
                console.log(`already contain new category`)
            }

            return {
                ...state,
                new_categories: cat_list
            }
        },
        increaseIdInBatch(state, action) {
            const cur_id_in_batch = state.cur_completed_id_in_batch
            return {
                ...state,
                cur_completed_id_in_batch: cur_id_in_batch+1
            }
        }
    },
    extraReducers: {
        [fetchElements.fulfilled]: (state, action) => {
            const data = action.payload
            console.log(`fetchElements`, data)

            var initialFocusedState = {}

            for (var i = 0; i < data['elements'].length; i++) {
                initialFocusedState['L'+i] = false
            }

            initialFocusedState['L0'] = true

            var initialLabelState = {}

            var pos_label = 0

            var neg_label = 0

            for (var i = 0; i < data['elements'].length; i++) {
                if (state.curCategory in data['elements'][i]['user_labels']) {
                    if (data['elements'][i]['user_labels'][state.curCategory] == 'true') {
                        initialLabelState['L'+i] = 'pos'
                        pos_label += 1
                    } else if (data['elements'][i]['user_labels'][state.curCategory] == 'false') {
                        initialLabelState['L'+i] = 'neg'
                        neg_label += 1
                    }
                } else {
                    initialLabelState['L'+i] = ""
                }
            }

            return {
                ...state,
                elements: data['elements'],
                focusedState: initialFocusedState,
                focusedIndex: 0,
                labelState: initialLabelState,
                ready: true,
                pos_label_num_doc: pos_label,
                neg_label_num_doc: neg_label
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

            var elements = data['elements']

            // var doc_elements = [ ... state.elements ]

            var predictionForDocCat = Array(state.elements.length-1).fill(false)

            console.log(`positive elements: `, data['positive_elements'])

            elements.map((e, i) => {
                // const docid = e['docid']
                // var eids = e['id'].split('-')
                // const eid = parseInt(eids[eids.length-1])

                // if(docid == state.curDocName) {
                //     // console.log(`eid: ${eid}, i: ${i}`)

                //     predictionForDocCat[eid] = true
                // }

                if (state.curCategory in e['model_predictions']) {
                    const pred = e['model_predictions'][state.curCategory]

                    if (pred == 'true') {
                        predictionForDocCat[i] = true
                    } else {
                        predictionForDocCat[i] = false
                    }
                }

                
            })

            console.log(`prediction on doc: `, predictionForDocCat)

            return {
                ...state,
                predictionForDocCat: predictionForDocCat
            }
        },
        [downloadLabeling.fulfilled]: (state, action) => {
            const data = action.payload
            fileDownload(data, 'labeling-data.csv')
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

            var pos_label = 0

            var neg_label = 0

            for (var i = 0; i < data['elements'].length; i++) {
                if (state.curCategory in data['elements'][i]['user_labels']) {
                    if (data['elements'][i]['user_labels'][state.curCategory] == 'true') {
                        initialLabelState['L'+i] = 'pos'
                        pos_label += 1
                    } else if (data['elements'][i]['user_labels'][state.curCategory] == 'false') {
                        initialLabelState['L'+i] = 'neg'
                        neg_label += 1
                    }
                } else {
                    initialLabelState['L'+i] = ""
                }
            }

            return {
                ...state,
                elements: data['elements'],
                curDocId: state.curDocId+1,
                curDocName: state['documents'][state.curDocId+1]['document_id'],
                focusedState: initialFocusedState,
                focusedIndex: 0,
                labelState: initialLabelState,
                ready: true,
                pos_label_num_doc: pos_label,
                neg_label_num_doc: neg_label
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

            var pos_label = 0

            var neg_label = 0

            for (var i = 0; i < data['elements'].length; i++) {
                if (state.curCategory in data['elements'][i]['user_labels']) {
                    if (data['elements'][i]['user_labels'][state.curCategory] == 'true') {
                        initialLabelState['L'+i] = 'pos'
                        pos_label += 1
                    } else if (data['elements'][i]['user_labels'][state.curCategory] == 'false') {
                        initialLabelState['L'+i] = 'neg'
                        neg_label += 1
                    }
                } else {
                    initialLabelState['L'+i] = ""
                }
            }

            return {
                ...state,
                elements: data['elements'],
                curDocId: state.curDocId-1,
                curDocName: state['documents'][state.curDocId-1]['document_id'],
                focusedState: initialFocusedState,
                focusedIndex: 0,
                labelState: initialLabelState,
                ready: true,
                pos_label_num_doc: pos_label,
                neg_label_num_doc: neg_label
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

            return {
                ...state,
                elementsToLabel: data['elements'],
                ready: true
            }
        },
        [checkModelUpdate.fulfilled]: (state, action) => {

            const data = action.payload

            const model_num = data['models'].length

            var latest_model_version = -1

            if (model_num > 0) {
                
                latest_model_version = data['models'][model_num-1]['iteration']
            }

            console.log(`latest model version: ${latest_model_version}`)

            return {
                ...state,
                model_version: latest_model_version
            }

        },
        [fetchCertainDocument.fulfilled]: (state, action) => {

            const response = action.payload
            const data = response['data']
            const eid = response['eid']
            const status = response['switchStatus']

            var initialFocusedState = {}

            for (var i = 0; i < data['elements'].length; i++) {
                initialFocusedState['L'+i] = false
            }

            console.log(`data['eid]: ${eid}`)

            initialFocusedState['L'+eid] = true

            var initialLabelState = null

            console.log(`status: ${status}`)

            if (status == 'switch') {

                initialLabelState = {}

                console.log(`switch status`)

                for (var i = 0; i < data['elements'].length; i++) {
                    initialLabelState['L'+i] = ""
                }
            } else {
                console.log(`search status`)
                initialLabelState = { ...state['labelState'] }
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
        [checkStatus.fulfilled]: (state, action) => {
            const response = action.payload

            console.log(`checkStatus: `, response['labeling_counts'])

            const progress = response['progress']['all']

            const notifications = response['notifications']

            console.log(`notifications: `, notifications)

            var status = null

            var new_id_in_batch = state.cur_completed_id_in_batch

            var pos_label = state['pos_label_num']

            var neg_label = state['neg_label_num']

            // if (state.cur_completed_id_in_batch < state.training_batch - 1 ) {
            //     status = "New model is not ready"
            // } else if (state.cur_completed_id_in_batch == state.training_batch - 1) {
            //     status = "New model is almost ready"
            // } else {
            //     status = "New model is ready"
            // }

            if ( progress < 80 ) {
                status = 'New model is not ready'
            }

            if ( progress == 80 ) {
                status = 'New model is almost ready'
            }

            if ( progress == 100 ) {
                status = 'New model is ready'
            }

            if (state.cur_completed_id_in_batch == state.training_batch) {
                new_id_in_batch = 0
            }

            if ( 'true' in response['labeling_counts'] ) {
                pos_label = response['labeling_counts']['true']
            } else {
                pos_label = 0
            }

            if ( 'false' in response['labeling_counts'] ) {
                neg_label = response['labeling_counts']['false']
            } else {
                neg_label = 0
            }


            console.log(`pos_label: ${pos_label}, neg_label: ${neg_label}`)

            return {
                ...state,
                modelUpdateProgress: progress,
                cur_completed_id_in_batch: new_id_in_batch,
                modelStatus: status,
                pos_label_num: pos_label,
                neg_label_num: neg_label
            }
        }
    }
})

export default DataSlice.reducer;
export const { updateCurCategory, increaseIdInBatch, createNewCategory, prevPrediction, nextPrediction, setFocusedState, setLabelState } = DataSlice.actions;