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
import fileDownload from "js-file-download";

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
  getCategoryQueryString,
  getQueryParamsString,
} from "../../../utils/utils";
import { panelIds } from "../../../const";

export { fetchDocuments } from "./documentSlice";
export {
  getPositivePredictions,
  getAllPositiveLabels,
  getSuspiciousLabels,
  getContradictingLabels,
  getElementToLabel,
  searchKeywords,
  fetchElements,
  fetchNextDocElements,
  fetchPrevDocElements,
  fetchCertainDocument,
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

export const initialState = {
  ...initialPanelsState,
  workspaceId: "",
  curDocId: 0,
  curDocName: "",
  documents: [],
  categories: [],
  curCategory: null,
  modelVersion: null,
  modelUpdateProgress: 0,
  new_categories: [],
  isDocLoaded: false,
  numLabel: { pos: 0, neg: 0 },
  numLabelGlobal: {},
  isSearchActive: false,
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
  downloadingModel: false,
  labelCount: {
    workspacePos: 0,
    workspaceNeg: 0,
    documentPos: 0,
    documentNeg: 0,
  },
};

const getWorkspace_url = `${BASE_URL}/${WORKSPACE_API}`;

export const checkModelUpdate = createAsyncThunk(
  "workspace/check_model_update",
  async (_, { getState }) => {
    const state = getState();

    const queryParams = getQueryParamsString([
      getCategoryQueryString(state.workspace.curCategory),
    ]);

    var url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/models${queryParams}`;

    const { data } = await client.get(url);
    return data;
  }
);

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

export const downloadModel = createAsyncThunk(
  "workspace/downloadModel",
  async (_, { getState }) => {
    const state = getState();
    const queryParams = getQueryParamsString([
      getCategoryQueryString(state.workspace.curCategory),
    ]);
    
    const url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
      )}/export_model${queryParams}`;
      
      const { data } = await client.get(url, {
        headers: {
          "Content-Type": "application/zip",
        },
        parseResponseBodyAs: "blob",
      });
      
      const current = new Date();
      const date = `${current.getDate()}/${
        current.getMonth() + 1
      }/${current.getFullYear()}`;
    const fileName = `model-category_${curCategoryNameSelector(state)}-version_${state.workspace.modelVersion}-${date}.zip`;
    fileDownload(data, fileName);
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
    [checkModelUpdate.fulfilled]: (state, action) => {
      const { models } = action.payload;
      let updatedEvaluationState = {};
      let latestReadyModelVersion = null;
      let nextModelShouldBeTraining;

      models.reverse().forEach((m) => {
        if (
          latestReadyModelVersion === null &&
          m["active_learning_status"] === "READY"
        ) {
          latestReadyModelVersion = m["iteration"];
        }
        if (
          !("lastScore" in updatedEvaluationState) &&
          "estimated_precision" in m
        ) {
          updatedEvaluationState = {
            lastScore: m["estimated_precision"],
            scoreModelVersion: m["iteration"] + 1,
          };
        }
      });

      if (latestReadyModelVersion === null) {
        latestReadyModelVersion = -1;
      }
      // if there is a model available, start counting the version from 1 (not 0)
      else if (latestReadyModelVersion >= 0) {
        latestReadyModelVersion += 1;
      }

      // logic to manage the next model status, it is first set to true in checkStatus when progress is 100

      // if there are non-ready models, it means that a model is training
      if (!latestReadyModelVersion && models.length) {
        nextModelShouldBeTraining = true;
      }
      // if there are no models yet, next model status depends on
      // progress bar having been full or not
      else if (!models.length) {
        nextModelShouldBeTraining = state.nextModelShouldBeTraining;
      }
      // if there is at least one ready model found, next model status depends on
      // the last ready model is already known. If it is not the same means training has
      // finished
      else if (latestReadyModelVersion) {
        nextModelShouldBeTraining =
          latestReadyModelVersion === state.modelVersion
            ? state.nextModelShouldBeTraining
            : false;
      }
      state.modelVersion = latestReadyModelVersion;
      state.nextModelShouldBeTraining = nextModelShouldBeTraining;
      state.panels[panelIds.EVALUATION] = {
        ...state.panels[panelIds.EVALUATION],
        ...updatedEvaluationState,
      };
    },
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
    [downloadModel.pending]: (state, action) => {
      state.downloadingModel = true;
    },
    [downloadModel.fulfilled]: (state, action) => {
      state.downloadingModel = false;
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
  setFocusedElement,
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
} = DataSlice.actions;
