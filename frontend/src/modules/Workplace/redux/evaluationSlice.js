import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getCategoryQueryString,
  getQueryParamsString,
  parseElements,
} from "../../../utils/utils";
import { BASE_URL, WORKSPACE_API } from "../../../config";

const getWorkspace_url = `${BASE_URL}/${WORKSPACE_API}`;

export const startEvaluation = createAsyncThunk(
  "workspace/startEvaluation",
  async (request, { dispatch }) => {
    await dispatch(getEvaluationElements());
  }
);

export const getEvaluationElements = createAsyncThunk(
  "workspace/getEvaluationElements",
  async (request, { getState }) => {
    const state = getState();

    const queryParams = getQueryParamsString([
      getCategoryQueryString(state.workspace.curCategory),
    ]);

    var url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/precision_evaluation_elements${queryParams}`;

    const data = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.authenticate.token}`,
      },
      method: "GET",
    }).then((response) => response.json());
    return data;
  }
);

export const getEvaluationResults = createAsyncThunk(
  "workspace/getEvaluationResults",
  async (changed_elements_count, { getState }) => {
    const state = getState();

    const ids = state.workspace.evaluation.elements.map((e) => e.id);
    const iteration = state.workspace.model_version - 1;

    const queryParams = getQueryParamsString([
      getCategoryQueryString(state.workspace.curCategory),
    ]);

    var url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/precision_evaluation_elements${queryParams}`;
    const data = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.authenticate.token}`,
      },
      body: JSON.stringify({
        ids,
        iteration,
        changed_elements_count,
      }),
      method: "POST",
    }).then((response) => response.json());

    return data;
  }
);

export const cancelEvaluation = createAsyncThunk(
  "workspace/cancelEvaluation",
  async (changed_elements_count, { getState }) => {
    const state = getState();

    const queryParams = getQueryParamsString([
      getCategoryQueryString(state.workspace.curCategory),
    ]);

    var url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/cancel_precision_evaluation${queryParams}`;
    const data = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.authenticate.token}`,
      },
      body: JSON.stringify({
        changed_elements_count,
      }),
      method: "POST",
    }).then((response) => response.json());

    return data;
  }
);

export const reducers = {
  cleanEvaluationState(state, action) {
    state.evaluation = {
      isLoading: false,
      isInProgress: false,
      elements: [],
      labelState: {},
      initialLabelState: {},
      lastScore: null,
      scoreModelVersion: null,
    };
  },
  setEvaluationLabelState(state, action) {
    state.evaluation.labelState = action.payload;
  },
};

export const extraReducers = {
  [startEvaluation.fulfilled]: (state, action) => {
    return {
      ...state,
      evaluation: {
        ...state.evaluation,
        isInProgress: true,
      },
    };
  },
  [getEvaluationElements.fulfilled]: (state, action) => {
    const { elements } = action.payload;
    const { initialLabelState } = parseElements(
      elements,
      state.curCategory,
      true
    );
    return {
      ...state,
      evaluation: {
        ...state.evaluation,
        elements,
        initialLabelState,
        labelState: initialLabelState,
        isLoading: false,
      },
    };
  },
  [getEvaluationElements.pending]: (state, action) => {
    return {
      ...state,
      evaluation: {
        ...state.evaluation,
        isLoading: true,
      },
    };
  },
  [getEvaluationElements.rejected]: (state, action) => {
    return {
      ...state,
      evaluation: {
        ...state.evaluation,
        isLoading: false,
      },
    };
  },
  [getEvaluationResults.fulfilled]: (state, action) => {
    const { score } = action.payload;

    return {
      ...state,
      evaluation: {
        ...state.evaluation,
        isLoading: false,
        isInProgress: false,
        lastScore: score,
        scoreModelVersion: state.model_version,
      },
    };
  },
  [getEvaluationResults.pending]: (state, action) => {
    return {
      ...state,
      evaluation: {
        ...state.evaluation,
        isLoading: true,
      },
    };
  },
  [getEvaluationResults.rejected]: (state, action) => {
    return {
      ...state,
      evaluation: {
        ...state.evaluation,
        isLoading: false,
      },
    };
  },
  [cancelEvaluation.fulfilled]: (state, action) => {
    return {
      ...state,
      evaluation: {
        ...state.evaluation,
        isInProgress: false,
        elements: [],
        labelState: {},
        initialLabelState: {},
      },
    };
  },
};
