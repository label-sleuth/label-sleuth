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
import { BASE_URL, WORKSPACE_API } from "../../../config"
import { reducers as searchReducers, extraReducers as searchExtraReducers } from './searchSlice'
import { reducers as documentReducers, extraReducers as documentExtraReducers } from './documentSlice'
import { reducers as sidebarPanelsReducers, extraReducers as sidebarPanelsExtraReducers } from './sidebarPanelsSlice'
import { reducers as labelReducers, extraReducers as labelExtraReducers } from './labelSlice'
import { reducers as categoryReducers, extraReducers as categoryExtraReducers } from './categorySlice'
import { reducers as evaluationReducers, extraReducers as evaluationExtraReducers } from './evaluationSlice'
import { getCategoryQueryString, getQueryParamsString } from '../../../utils/utils'

export { searchKeywords} from "./searchSlice";
export {
  fetchDocuments,
  fetchElements,
  fetchNextDocElements,
  fetchPrevDocElements,
  fetchCertainDocument,
} from "./documentSlice";
export {
  getPositivePredictions,
  getAllPositiveLabels,
  getDisagreementsElements,
  getSuspiciousLabels,
  getContradictingLabels,
  getPositiveElementForCategory,
  getElementToLabel,
} from "./sidebarPanelsSlice";
export {
    downloadLabels,
    uploadLabels,
    labelInfoGain,
    setElementLabel,
} from "./labelSlice"
export {
    fetchCategories,
    createCategoryOnServer,
    deleteCategory,
    editCategory,
} from './categorySlice'
export {
  startEvaluation,
  getEvaluationElements,
  getEvaluationResults,
  cancelEvaluation,
} from './evaluationSlice';

export const initialState = {
    workspaceId: "",
    curDocId: 0,
    curDocName: "",
    documents: [],
    elements: [],
    categories: [],
    curCategory: null,
    elementsToLabel: [],
    focusedIndex: null,
    focusedState: [],
    labelState: [],
    searchResult: null,
    searchUniqueElemRes: null,
    searchTotalElemRes: null,
    searchLabelState: [],
    posPredResult: [],
    posElemResult: [],
    disagreeElemResult: [],
    suspiciousElemResult:[],
    contradictiveElemDiffsResult: [],
    contradictiveElemPairsResult: [],
    posPredFraction: 0,
    posPredTotalElemRes: null,
    posPredLabelState: [],
    posElemLabelState: [],
    disagreeElemLabelState: [],
    suspiciousElemLabelState: [],
    contradictiveElemPairsLabelState: [],
    recommendToLabelState: [],
    model_version: null,
    indexPrediction: 0,
    predictionForDocCat: [],
    modelUpdateProgress: 0,
    new_categories: [],
    isDocLoaded: false,
    isCategoryLoaded: false,
    numLabel: { pos: 0, neg: 0 },
    numLabelGlobal: {},
    searchedIndex:0,
    isSearchActive: false,
    activePanel: "",
    searchInput: null,
    // tells if there is a model training. The word 'should' is used because the value is calculated 
    // and it does not always come from the backend
    nextModelShouldBeTraining: false,
    // tells if the user visited the workspace at least once to open the tutorial the first time
    workspaceVisited: false,
    uploadedLabels: null,
    errorMessage: null,
    deletingCategory: false,
    uploadingLabels: false,
    downloadingLabels: false,
    loadingContradictingLabels: false,
    evaluation: {
        isLoading: false,
        isInProgress: false,
        elements: [],
        labelState: {},
        initialLabelState: {},
        lastScore: null,
        scoreModelVersion: null,
    },
    labelCount: {
        workspacePos: 0, 
        workspaceNeg: 0,
        documentPos: 0,
        documentNeg: 0
    },
}

const getWorkspace_url = `${BASE_URL}/${WORKSPACE_API}`

export const checkModelUpdate = createAsyncThunk('workspace/check_model_update', async (request, { getState }) => {

    const state = getState()

    const queryParams = getQueryParamsString([getCategoryQueryString(state.workspace.curCategory)])

    var url = `${getWorkspace_url}/${encodeURIComponent(state.workspace.workspaceId)}/models${queryParams}`

    const data = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.authenticate.token}`
        },
        method: "GET"
    }).then(response => response.json())

    return data

})

export const checkStatus = createAsyncThunk('workspace/get_labelling_status', async (request, { getState }) => {
    const state = getState()

    const queryParams = getQueryParamsString([getCategoryQueryString(state.workspace.curCategory)])

    var url =  `${getWorkspace_url}/${encodeURIComponent(state.workspace.workspaceId)}/status${queryParams}`

    const data = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.authenticate.token}`
        },
        method: "GET"
    }).then(response => response.json())

    return data
})


const DataSlice = createSlice({
    name: "workspace",
    initialState,
    reducers: {
        ...searchReducers,
        ...documentReducers,
        ...sidebarPanelsReducers,
        ...labelReducers,
        ...categoryReducers,
        ...evaluationReducers,
        setWorkspaceId(state, action) {
            state.workspaceId = action.payload
        },
        setIsCategoryLoaded(state, action) {
            state.isCategoryLoaded = action.payload
        },
        setIsDocLoaded(state, action) {
            state.isDocLoaded = action.payload
        },
        setIsDocLoaded(state, action) {
            state.isDocLoaded = action.payload
        },
        setSearchedIndex(state, action) {
            state.searchedIndex = action.payload
        },
        setIsSearchActive(state, action) {
            state.isSearchActive = action.payload
        },
        prevPrediction(state, action) {
            const pred_index = state.indexPrediction
            if (pred_index > 0) {
                return {
                    ...state,
                    indexPrediction: pred_index - 1
                }
            } else {
                return {
                    ...state
                }
            }
        },
        setFocusedState(state, action) {
            const id = action.payload

            var initialFocusedState = {}

            for (var i = 0; i < state['elements'].length; i++) {
                initialFocusedState['L' + i] = Object.assign({}, {[`L + ${i}`]: false});
            }

            initialFocusedState['L' + id] = true
            
            return {
                ...state,
                focusedState: initialFocusedState,
                focusedIndex: id
            }
        },
        cleanWorkplaceState(state, action) {
            return {
                ...initialState,
                workspaceVisited: state.workspaceVisited
            }
        },
        setWorkspaceVisited(state, action) {
            return {
                ...state,
                workspaceVisited: true
            }
        },
        clearError(state, action) {
            return {
                ...state,
                errorMessage: null
            }
        },
    },
    extraReducers: {
        ...searchExtraReducers,
        ...documentExtraReducers,
        ...sidebarPanelsExtraReducers,
        ...labelExtraReducers,
        ...categoryExtraReducers,
        ...evaluationExtraReducers,
        [checkModelUpdate.fulfilled]: (state, action) => {
            const { models } = action.payload
            let updatedEvaluationState = {}
            let latestReadyModelVersion = null
            let nextModelShouldBeTraining

            models.reverse().forEach(m => {
                if (latestReadyModelVersion === null && m['active_learning_status'] === 'READY') {
                    latestReadyModelVersion = m['iteration']
                }
                if (!('lastScore' in updatedEvaluationState) && "estimated_precision" in m) {
                    updatedEvaluationState = {
                        lastScore: m["estimated_precision"],
                        scoreModelVersion: m["iteration"] + 1
                    }
                }
            })
            
            if (latestReadyModelVersion === null) {
                latestReadyModelVersion = -1
            }
            // if there is a model available, start counting the version from 1 (not 0)
            else if (latestReadyModelVersion >= 0) {
                latestReadyModelVersion += 1
            }

            // logic to manage the next model status, it is first set to true in checkStatus when progress is 100

            // if there are non-ready models, it means that a model is training
            if (!latestReadyModelVersion && models.length) {
                nextModelShouldBeTraining = true
            }
            // if there are no models yet, next model status depends on 
            // progress bar having been full or not
            else if (!models.length) {
                nextModelShouldBeTraining = state.nextModelShouldBeTraining
            } 
            // if there is at least one ready model found, next model status depends on 
            // the last ready model is already known. If it is not the same means training has
            // finished
            else if (latestReadyModelVersion) {
                nextModelShouldBeTraining = latestReadyModelVersion === state.model_version ? state.nextModelShouldBeTraining : false
            }            

            return {
                ...state,
                model_version: latestReadyModelVersion,
                nextModelShouldBeTraining: nextModelShouldBeTraining,
                evaluation: {
                    ...state.evaluation,
                    ...updatedEvaluationState,
                }
            }

        },
        [checkStatus.fulfilled]: (state, action) => {
            const response = action.payload
            const progress = response['progress']['all']

            return {
                ...state,
                modelUpdateProgress: progress,
                labelCount: {
                    ...state.labelCount,
                    workspacePos: response['labeling_counts']['true'] ?? 0,
                    workspaceNeg: response['labeling_counts']['false'] ?? 0
                },
                nextModelShouldBeTraining: progress === 100 ? true : state.nextModelShouldBeTraining
            }
        },
    }
})

// selector for getting the current category name (curCategory is a category id)
export const curCategoryNameSelector = (state) => {
  return state.workspace.categories.find(
    (cat) => cat.category_id == state.workspace.curCategory
  )?.category_name;
};

export default DataSlice.reducer;
export const { 
    updateCurCategory,
    prevPrediction,
    setWorkspace,
    setFocusedState,
    setWorkspaceId,
    setIsCategoryLoaded,
    setIsDocLoaded,
    resetSearchResults,
    setSearchLabelState,
    setRecommendToLabelState,
    setPosPredLabelState,
    setPosElemLabelState,
    setDisagreeElemLabelState,
    setSuspiciousElemLabelState,
    setContradictiveElemLabelState,
    setEvaluationLabelState,
    setLabelState,
    cleanWorkplaceState,
    setNumLabelGlobal,
    updateDocumentLabelCountByDiff,
    setSearchedIndex,
    setIsSearchActive,
    setActivePanel,
    setSearchInput,
    setWorkspaceVisited,
    clearError,
    cleanEvaluationState
 } = DataSlice.actions;