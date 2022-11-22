import { createAsyncThunk } from "@reduxjs/toolkit";
import { getCategoryQueryString, getQueryParamsString } from "../../../utils/utils";
import { BASE_URL, WORKSPACE_API } from "../../../config";
import { panelIds } from "../../../const";
import { client } from "../../../api/client";
import fileDownload from "js-file-download";
import { curCategoryNameSelector } from "./DataSlice";
import { getWorkspaceId } from "../../../utils/utils";

const getWorkspace_url = `${BASE_URL}/${WORKSPACE_API}`;

export const initialState = {
  modelVersion: null,
  modelUpdateProgress: 0,
  // tells if there is a model training. The word 'should' is used because the value is calculated
  // and it does not always come from the backend
  nextModelShouldBeTraining: false,
  downloadingModel: false,
  lastModelFailed: false,
};

export const checkModelUpdate = createAsyncThunk("workspace/check_model_update", async (_, { getState }) => {
  const state = getState();

  const queryParams = getQueryParamsString([getCategoryQueryString(state.workspace.curCategory)]);

  var url = `${getWorkspace_url}/${encodeURIComponent(getWorkspaceId())}/models${queryParams}`;

  const { data } = await client.get(url);
  return data;
});

export const downloadModel = createAsyncThunk("workspace/downloadModel", async (_, { getState }) => {
  const state = getState();
  const queryParams = getQueryParamsString([getCategoryQueryString(state.workspace.curCategory)]);

  const url = `${getWorkspace_url}/${encodeURIComponent(getWorkspaceId())}/export_model${queryParams}`;

  const { data } = await client.get(url, {
    headers: {
      "Content-Type": "application/zip",
    },
    parseResponseBodyAs: "blob",
  });

  const current = new Date();
  const date = `${current.getDate()}/${current.getMonth() + 1}/${current.getFullYear()}`;
  const fileName = `model-category_${curCategoryNameSelector(state)}-version_${
    state.workspace.modelVersion
  }-${date}.zip`;
  fileDownload(data, fileName);
});

export const reducers = {};

export const extraReducers = {
  [checkModelUpdate.fulfilled]: (state, action) => {
    const { models } = action.payload;
    let updatedEvaluationState = {};
    let latestReadyModelVersion = null;
    let nextModelShouldBeTraining;

    const lastModelFailed = models.length ? models[models.length - 1]["iteration_status"] === "ERROR" : false;

    models.reverse().forEach((m) => {
      if (latestReadyModelVersion === null && m["iteration_status"] === "READY") {
        latestReadyModelVersion = m["iteration"];
      }
      if (!("lastScore" in updatedEvaluationState) && "estimated_precision" in m) {
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
        latestReadyModelVersion === state.modelVersion ? state.nextModelShouldBeTraining : false;
    }
    state.modelVersion = latestReadyModelVersion;
    state.lastModelFailed = lastModelFailed;
    state.nextModelShouldBeTraining = nextModelShouldBeTraining;
    state.panels[panelIds.EVALUATION] = {
      ...state.panels[panelIds.EVALUATION],
      ...updatedEvaluationState,
    };

    const panelsToResetPagination = [
      panelIds.LABEL_NEXT,
      panelIds.POSITIVE_PREDICTIONS,
      panelIds.SUSPICIOUS_LABELS,
      panelIds.CONTRADICTING_LABELS,
    ];
    panelsToResetPagination.forEach((pId) => {
      state.panels[pId].page = 1
    });

  },
  [downloadModel.pending]: (state, action) => {
    state.downloadingModel = true;
  },
  [downloadModel.fulfilled]: (state, action) => {
    state.downloadingModel = false;
  },
};
