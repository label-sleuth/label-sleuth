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
import { BASE_URL, WORKSPACE_API } from "../../../config";
import { client } from "../../../api/client";

import {
  reducers as documentReducers,
  extraReducers as documentExtraReducers,
} from "./documentSlice";
import {
  initialState as initialPanelsState,
  reducers as panelsReducers,
  extraReducers as panelsExtraReducers,
} from "./panelsSlice";
import {
  reducers as labelReducers,
  extraReducers as labelExtraReducers,
} from "./labelSlice";
import {
  reducers as categoryReducers,
  extraReducers as categoryExtraReducers,
} from "./categorySlice";
import {
  reducers as evaluationReducers,
  extraReducers as evaluationExtraReducers,
} from "./evaluationSlice";
import {
  initialState as initialModelState,
  reducers as modelReducers,
  extraReducers as modelExtraReducers,
} from "./modelSlice";
import {
  getCategoryQueryString,
  getQueryParamsString,
} from "../../../utils/utils";

export { fetchDocuments } from "./documentSlice";
export {
  getPositivePredictions,
  getAllPositiveLabels,
  getSuspiciousLabels,
  getContradictingLabels,
  getElementToLabel,
  searchKeywords,
} from "./panelsSlice";
export {
  downloadLabels,
  uploadLabels,
  labelInfoGain,
  setElementLabel,
} from "./labelSlice";
export {
  fetchCategories,
  createCategoryOnServer,
  deleteCategory,
  editCategory,
} from "./categorySlice";
export {
  startEvaluation,
  getEvaluationElements,
  getEvaluationResults,
  cancelEvaluation,
} from "./evaluationSlice";
export {checkModelUpdate, downloadModel} from './modelSlice'

export const initialState = {
  ...initialPanelsState,
  ...initialModelState,
  workspaceId: "",
  curDocId: 0,
  curDocName: "",
  documents: [],
  categories: [],
  curCategory: null,
  new_categories: [],
  isDocLoaded: false,
  numLabel: { pos: 0, neg: 0 },
  numLabelGlobal: {},
  isSearchActive: false,
  // tells if the user visited the workspace at least once to open the tutorial the first time
  workspaceVisited: false,
  uploadedLabels: null,
  errorMessage: null,
  deletingCategory: false,
  uploadingLabels: false,
  downloadingLabels: false,
  labelCount: {
    workspacePos: 0,
    workspaceNeg: 0,
    documentPos: 0,
    documentNeg: 0,
  },
};

const getWorkspace_url = `${BASE_URL}/${WORKSPACE_API}`;


export const checkStatus = createAsyncThunk(
  "workspace/get_labelling_status",
  async (_, { getState }) => {
    const state = getState();

    const queryParams = getQueryParamsString([
      getCategoryQueryString(state.workspace.curCategory),
    ]);

    var url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/status${queryParams}`;

    const { data } = await client.get(url);
    return data;
  }
);

/**
 * This is the main slice of the workspace. It adds reducers and extrareducers (the reducers
 * of the thunk actions) from the other slices present in this folder.
 */
const DataSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    ...documentReducers,
    ...panelsReducers,
    ...labelReducers,
    ...categoryReducers,
    ...evaluationReducers,
    ...modelReducers,
    setWorkspaceId(state, action) {
      state.workspaceId = action.payload;
    },
    cleanWorkplaceState(state, action) {
      return {
        ...initialState,
        workspaceVisited: state.workspaceVisited,
      };
    },
    setWorkspaceVisited(state, action) {
      return {
        ...state,
        workspaceVisited: true,
      };
    },
  },
  extraReducers: {
    ...documentExtraReducers,
    ...panelsExtraReducers,
    ...labelExtraReducers,
    ...categoryExtraReducers,
    ...evaluationExtraReducers,
    ...modelExtraReducers,
    [checkStatus.fulfilled]: (state, action) => {
      const response = action.payload;
      const progress = response["progress"]["all"];

      return {
        ...state,
        modelUpdateProgress: progress,
        labelCount: {
          ...state.labelCount,
          workspacePos: response["labeling_counts"]["true"] ?? 0,
          workspaceNeg: response["labeling_counts"]["false"] ?? 0,
        },
        nextModelShouldBeTraining:
          progress === 100 ? true : state.nextModelShouldBeTraining,
      };
    },
  },
});

// selector for getting the current category name (curCategory is a category id)
export const curCategoryNameSelector = (state) => {
  /**
   * The == is used instead of === because there
   * is not clear which is the type of the
   * categoryId.
   */
  return state.workspace.categories.find(
    (cat) => cat.category_id == state.workspace.curCategory
  )?.category_name;
};

export const activePanelSelector = (state) => {
  return state.workspace.panels[state.workspace.panels.activePanelId];
};

export default DataSlice.reducer;
export const {
  updateCurCategory,
  prevPrediction,
  setWorkspace,
  setFocusedMainPanelElement,
  setWorkspaceId,
  resetSearchResults,
  setSearchLabelState,
  setRecommendToLabelState,
  setPosPredLabelState,
  setPosElemLabelState,
  setSuspiciousElemLabelState,
  setContradictiveElemLabelState,
  setEvaluationLabelState,
  setLabelState,
  cleanWorkplaceState,
  setNumLabelGlobal,
  updateDocumentLabelCountByDiff,
  setIsSearchActive,
  setActivePanel,
  setSearchInput,
  resetLastSearchString,
  setWorkspaceVisited,
  cleanEvaluationState,
  updateMainPanelElement,
  cleanUploadedLabels,
  changeCurrentDocument,
  setPage,
  setRefetch,
  focusFirstElement,
  clearMainPanelFocusedElement,
  fetchElements,
  setfocusedSidebarElementByIndex,
  focusNextSidebarElement,
  focusPreviousSidebarElement,
  focusFirstSidebarElement,
  focusLastSidebarElement,
  updateElementOptimistically,
  reverseOptimisticUpdate,
} = DataSlice.actions;
