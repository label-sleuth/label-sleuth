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

import { createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { getCategoryQueryString, getQueryParamsString, parseElements } from "../../../utils/utils";
import { BASE_URL, WORKSPACE_API } from "../../../config";
import { PanelIdsEnum } from "../../../const";
import { client } from "../../../api/client";
import { getWorkspaceId } from "../../../utils/utils";
import { RootState } from "../../../store/configureStore";
import { Element, ElementsDict, FetchPanelElementsParams, UnparsedElement, WorkspaceState } from "../../../global";

const getWorkspace_url = `${BASE_URL}/${WORKSPACE_API}`;

export const getEvaluationElements = createAsyncThunk<
  UnparsedElement[],
  FetchPanelElementsParams,
  {
    state: RootState;
  }
>("workspace/getEvaluationElements", async (request, { getState }) => {
  const state = getState();

  const queryParams = getQueryParamsString([getCategoryQueryString(state.workspace.curCategory)]);

  var url = `${getWorkspace_url}/${encodeURIComponent(getWorkspaceId())}/precision_evaluation_elements${queryParams}`;

  const response = await client.get(url);
  return response.data;
});

export const getEvaluationResults = createAsyncThunk<
  { score: number },
  number,
  {
    state: RootState;
  }
>("workspace/getEvaluationResults", async (changed_elements_count, { getState }) => {
  const state = getState();

  const ids: string[] = Object.values(state.workspace.panels.panels[PanelIdsEnum.EVALUATION].elements as ElementsDict).map(
    (e: Element) => e.id
  );

  // we know that modelVersion wont be null but typescript ask to check
  if (state.workspace.modelVersion === null) return;

  const iteration = state.workspace.modelVersion - 1;
  const queryParams = getQueryParamsString([getCategoryQueryString(state.workspace.curCategory)]);

  var url = `${getWorkspace_url}/${encodeURIComponent(getWorkspaceId())}/precision_evaluation_elements${queryParams}`;

  const response = await client.post(url, {
    ids,
    iteration,
    changed_elements_count,
  });

  return response.data;
});

export const cancelEvaluation = createAsyncThunk<
  { canceled: string },
  number,
  {
    state: RootState;
  }
>("workspace/cancelEvaluation", async (changed_elements_count, { getState }) => {
  const state = getState();

  const queryParams = getQueryParamsString([getCategoryQueryString(state.workspace.curCategory)]);

  var url = `${getWorkspace_url}/${encodeURIComponent(getWorkspaceId())}/cancel_precision_evaluation${queryParams}`;

  const response = await client.post(url, {
    changed_elements_count,
  });
  return response.data;
});

export const reducers = {
  cleanEvaluationState(state: WorkspaceState, action: PayloadAction<void>) {
    state.panels.panels[PanelIdsEnum.EVALUATION] = {
      ...state.panels.panels[PanelIdsEnum.EVALUATION],
      isInProgress: false,
      elements: {},
      initialElements: {},
      lastScore: null,
      scoreModelVersion: null,
    };
  },
};

export const extraReducers = [
  {
    action: getEvaluationElements.fulfilled,
    reducer: (state: WorkspaceState, action: PayloadAction<{ elements: UnparsedElement[] }>) => {
      if (state.curCategory === null) return;
      
      const { elements: unparsedElements } = action.payload;

      const { elements: initialElements } = parseElements(
        unparsedElements,
        state.curCategory
      );

      state.panels.panels[PanelIdsEnum.EVALUATION].isInProgress = true;
      state.panels.loading[PanelIdsEnum.EVALUATION] = false;
      state.panels.panels[PanelIdsEnum.EVALUATION].initialElements = initialElements;
      state.panels.panels[PanelIdsEnum.EVALUATION] = {
        ...state.panels.panels[PanelIdsEnum.EVALUATION],
        initialElements,
        elements: initialElements,
        hitCount: Object.keys(initialElements).length,
      };
    },
  },
  {
    action: getEvaluationElements.pending,
    reducer: (state: WorkspaceState, action: PayloadAction<void>) => {
      state.panels.loading[PanelIdsEnum.EVALUATION] = true;
    },
  },
  {
    action: getEvaluationElements.rejected,
    reducer: (state: WorkspaceState, action: PayloadAction<void>) => {
      state.panels.loading[PanelIdsEnum.EVALUATION] = false;
    },
  },
  {
    action: getEvaluationResults.fulfilled,
    reducer: (state: WorkspaceState, action: PayloadAction<{ score: number }>) => {
      const { score } = action.payload;
      state.panels.loading[PanelIdsEnum.EVALUATION] = false;
      state.panels.panels[PanelIdsEnum.EVALUATION] = {
        ...state.panels.panels[PanelIdsEnum.EVALUATION],
        isInProgress: false,
        lastScore: score,
        scoreModelVersion: state.modelVersion,
      };
    },
  },
  {
    action: getEvaluationResults.pending,
    reducer: (state: WorkspaceState, action: PayloadAction<void>) => {
      state.panels.loading[PanelIdsEnum.EVALUATION] = true;
    },
  },
  {
    action: getEvaluationResults.rejected,
    reducer: (state: WorkspaceState, action: PayloadAction<void>) => {
      state.panels.loading[PanelIdsEnum.EVALUATION] = false;
    },
  },
  {
    action: cancelEvaluation.pending,
    reducer: (state: WorkspaceState, action: PayloadAction<void>) => {
      state.panels.loading[PanelIdsEnum.EVALUATION] = true;
    },
  },
  {
    action: cancelEvaluation.fulfilled,
    reducer: (state: WorkspaceState, action: PayloadAction<void>) => {
      state.panels.loading[PanelIdsEnum.EVALUATION] = false;
      state.panels.panels[PanelIdsEnum.EVALUATION] = {
        ...state.panels.panels[PanelIdsEnum.EVALUATION],
        initialElements: {},
        isInProgress: false,
        elements: {},
        hitCount: null,
      };
    },
  },
];
