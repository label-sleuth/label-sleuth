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

import {
  createSlice,
  createAsyncThunk,
  ActionReducerMapBuilder,
  PayloadAction,
} from "@reduxjs/toolkit";
import { BASE_URL, WORKSPACE_API } from "../../../config";
import { client } from "../../../api/client";
import {
  initialState as initialDocumentsState,
  reducers as documentReducers,
  extraReducers as documentExtraReducers,
} from "./documentSlice";
import {
  initialState as initialPanelsState,
  reducers as panelsReducers,
  extraReducers as panelsExtraReducers,
} from "./panelsSlice";
import {
  initialState as initialLabelState,
  reducers as labelReducers,
  extraReducers as labelExtraReducers,
} from "./labelSlice";
import {
  initialCategorySliceState,
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
  getModeQueryParam,
  getQueryParamsString,
  getWorkspaceId,
} from "../../../utils/utils";
import { RootState } from "../../../store/configureStore";
import {
  Category,
  LabelingCountsUnparsed,
  ReducerObj,
  WorkspaceState,
} from "../../../global";
import { PanelIdsEnum, WorkspaceMode } from "../../../const";

export { fetchDocumentsMetadata, preloadDataset } from "./documentSlice";
export {
  getModelPredictions,
  getUserLabels as getAllPositiveLabels,
  getSuspiciousLabels,
  getContradictingLabels,
  getElementToLabel,
  searchKeywords,
} from "./panelsSlice";
export { downloadLabels, uploadLabels, setElementLabel } from "./labelSlice";
export {
  fetchCategories,
  createCategoryOnServer,
  deleteCategory,
  editCategory,
} from "./categorySlice";
export {
  getEvaluationElements,
  getEvaluationResults,
  cancelEvaluation,
} from "./evaluationSlice";
export { checkModelUpdate, downloadModel } from "./modelSlice";

export const initialState: WorkspaceState = {
  ...initialPanelsState,
  ...initialModelState,
  ...initialCategorySliceState,
  ...initialDocumentsState,
  ...initialLabelState,
  isSearchActive: false,
  errorMessage: null,
  downloadingLabels: false,
  systemVersion: null,
  mode: WorkspaceMode.NOT_SET,
};

const getWorkspace_url = `${BASE_URL}/${WORKSPACE_API}`;

interface CheckStatusResponse {
  labeling_counts: LabelingCountsUnparsed | { [key: string]: number };
  progress: { all: number };
}

export const checkStatus = createAsyncThunk<
  CheckStatusResponse,
  void,
  { state: RootState }
>("workspace/get_labelling_status", async (_, { getState }) => {
  const state = getState();

  const queryParams = getQueryParamsString([
    getCategoryQueryString(state.workspace.curCategory),
    getModeQueryParam(state.workspace.mode),
  ]);

  const url = `${getWorkspace_url}/${encodeURIComponent(
    getWorkspaceId()
  )}/status${queryParams}`;

  const { data } = await client.get(url);
  return data;
});

export const fetchVersion = createAsyncThunk(
  "workspace/get_version",
  async (_, { getState }) => {
    const url = `${BASE_URL}/version`;
    const { data } = await client.get(url);
    return data;
  }
);

/**
 * This is the main slice of the workspace. It adds reducers and extrareducers (the reducers
 * of the thunk actions) from the other slices present in this folder.
 * Those other slices are actually pseudo-slices because they are merged into a single one.
 * A refactor could make them actual slices.
 */
const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    ...documentReducers,
    ...panelsReducers,
    ...labelReducers,
    ...categoryReducers,
    ...evaluationReducers,
    ...modelReducers,
    cleanWorkplaceState(state, action: PayloadAction<void>) {
      const initialStateAux = { ...initialState };
      initialStateAux.systemVersion = state.systemVersion;
      return initialStateAux;
    },
    switchMode(state, action: PayloadAction<void>) {
      state.mode =
        state.mode === WorkspaceMode.BINARY
          ? WorkspaceMode.MULTICLASS
          : WorkspaceMode.BINARY;
    },
    changeMode(state, action: PayloadAction<WorkspaceMode>) {
      state.mode = action.payload;
    },
  },
  extraReducers: (builder: ActionReducerMapBuilder<WorkspaceState>) => {
    const allExtraReducers: Array<ReducerObj> = [
      ...categoryExtraReducers,
      ...panelsExtraReducers,
      ...documentExtraReducers,
      ...labelExtraReducers,
      ...evaluationExtraReducers,
      ...modelExtraReducers,
    ];
    allExtraReducers.forEach(({ action, reducer }) =>
      builder.addCase(action, reducer)
    );
    builder
      .addCase(
        checkStatus.fulfilled,
        (state: WorkspaceState, action: PayloadAction<CheckStatusResponse>) => {
          const response = action.payload;
          const progress = response["progress"]["all"];
          const unparsedLabelCount: LabelingCountsUnparsed =
            response["labeling_counts"];

          const mode = state.mode;
          let labelCount: { [key: string]: number } = {};
          if (mode === WorkspaceMode.BINARY) {
            labelCount = {
              pos: unparsedLabelCount["true"] || 0,
              neg: unparsedLabelCount["false"] || 0,
              weakPos: unparsedLabelCount["weak_true"] || 0,
              weakNeg: unparsedLabelCount["weak_false"] || 0,
            };
          } else if (mode === WorkspaceMode.MULTICLASS) {
            labelCount = unparsedLabelCount;
          }

          return {
            ...state,
            modelUpdateProgress: progress,
            labelCount: labelCount,
            nextModelShouldBeTraining:
              progress === 100 ? true : state.nextModelShouldBeTraining,
          };
        }
      )
      .addCase(fetchVersion.fulfilled, (state, action) => {
        const { version } = action.payload;
        if (version !== null) {
          state.systemVersion = version;
        }
      });
  },
});

// selector for getting the current category name (curCategory is a category id)
export const curCategoryNameSelector = (state: RootState) => {
  /**
   * The == is used instead of === because there
   * is not clear which is the type of the
   * categoryId.
   */
  return state.workspace.categories.find(
    (cat: Category) => cat.category_id === state.workspace.curCategory
  )?.category_name;
};

// selector for getting the current category name (curCategory is a category id)
export const curCategoryDescriptionSelector = (state: RootState) => {
  /**
   * The == is used instead of === because there
   * is not clear which is the type of the
   * categoryId.
   */
  return state.workspace.categories.find(
    (cat: Category) => cat.category_id === state.workspace.curCategory
  )?.category_description;
};

export const activePanelSelector = (state: RootState) => {
  return state.workspace.panels.activePanelId !== PanelIdsEnum.NOT_SET
    ? state.workspace.panels.panels[state.workspace.panels.activePanelId]
    : null;
};

export const workspaceReducer = workspaceSlice.reducer;
export default workspaceSlice.reducer;

export const {
  updateCurCategory,
  setFocusedMainPanelElement,
  resetSearchResults,
  cleanWorkplaceState,
  setActivePanel,
  setSearchInput,
  resetLastSearchString,
  cleanEvaluationState,
  cleanUploadedLabels,
  changeCurrentDocument,
  setPage,
  focusFirstElement,
  clearMainPanelFocusedElement,
  setfocusedSidebarElementByIndex,
  focusNextSidebarElement,
  focusPreviousSidebarElement,
  focusFirstSidebarElement,
  focusLastSidebarElement,
  updateElementOptimistically,
  reverseOptimisticUpdate,
  decreaseModelStatusCheckAttempts,
  resetModelStatusCheckAttempts,
  setModelIsLoading,
  switchMode,
  changeMode,
  setPanelFilters,
} = workspaceSlice.actions;
