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
import {} from "../../../utils/utils";
import { BASE_URL, WORKSPACE_API } from "../../../config";
import { PanelIdsEnum } from "../../../const";
import { client } from "../../../api/client";
import fileDownload from "js-file-download";
import { curCategoryNameSelector } from ".";
import {
  getWorkspaceId,
  getCategoryQueryString,
  getQueryParamsString,
} from "../../../utils/utils";
import {
  ModelSliceState,
  UnparsedIteration,
  WorkspaceState,
} from "../../../global";
import { RootState } from "../../../store/configureStore";
import { useWindowSize } from "usehooks-ts";
import { setModelIsLoading } from ".";

const getWorkspace_url = `${BASE_URL}/${WORKSPACE_API}`;

export const initialState: ModelSliceState = {
  modelVersion: null,
  modelUpdateProgress: 0,
  // tells if there is a model training. The word 'should' is used because the value is calculated
  // and it does not always come from the backend
  nextModelShouldBeTraining: false,
  // the following field is used to test whether a model is being trained or not when
  // the category changes. This covers the case where the labels that have been imported
  // for a category don't make the progress bar full but a model is being trained anyways
  modelStatusCheckAttempts: 0,
  downloadingModel: false,
  lastModelFailed: false,
};

export const checkModelUpdate = createAsyncThunk<
  { iterations: UnparsedIteration[] },
  void,
  {
    state: RootState;
  }
>("workspace/fetch_iterations", async (_, { getState }) => {
  const state = getState();

  const queryParams = getQueryParamsString([
    getCategoryQueryString(state.workspace.curCategory),
  ]);

  var url = `${getWorkspace_url}/${encodeURIComponent(
    getWorkspaceId()
  )}/iterations${queryParams}`;

  const { data } = await client.get(url);
  return data;
});

export const downloadModel = createAsyncThunk<
  void,
  void,
  {
    state: RootState;
  }
>("workspace/downloadModel", async (_, { getState, dispatch }) => {
  const state = getState();
  const queryParams = getQueryParamsString([
    getCategoryQueryString(state.workspace.curCategory),
  ]);

  const url = `${getWorkspace_url}/${encodeURIComponent(
    getWorkspaceId()
  )}/export_model${queryParams}`;
  console.log(
    `[model download]: about to perform the request at ${new Date().toJSON()}`
  );
  const { data: response }: { data: Response } = await client.get(url, {
    headers: {
      "Content-Type": "application/zip",
    },
    parseResponseBodyAs: "none",
  });
  console.log(`[model download]: received response ${new Date().toJSON()}`);

  const current = new Date();
  const date = `${current.getDate()}_${
    current.getMonth() + 1
  }_${current.getFullYear()}`;

  const fileName = `model-category_${curCategoryNameSelector(state)}-version_${
    state.workspace.modelVersion
  }-${date}.zip`;

  if (response !== null && response.body !== null) {
    const contentLength = response.headers.get("Content-Length");
    const contentLengthParsed = contentLength !== null ? +contentLength : 0;
    let receivedLength = 0; // received that many bytes at the moment

    const reader = response.body.getReader();

    const rs = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read();

          receivedLength += value ? value.length : 0;
          console.log(
            `Percentage: ${Math.round(
              (receivedLength / contentLengthParsed) * 100
            )}%`
          );

          // When no more data needs to be consumed, break the reading
          if (done) {
            break;
          }

          // Enqueue the next data chunk into our target stream
          controller.enqueue(value);
        }

        // Close the stream
        controller.close();
        reader.releaseLock();
      },
    });
    const newResponse = new Response(rs);
    console.log(
      `[model download]: parding the new recreated response ${new Date().toJSON()}`
    );
    const data = await newResponse.blob();

    console.log(
      `[model download]:  finished parsing the new recreated response ${new Date().toJSON()}`
    );

    fileDownload(data, fileName);

  // if (response !== null && response.body !== null) {
  //   const reader = response.body.getReader();

  //   // Step 2: get total length
  //   const contentLength = response.headers.get("Content-Length");
  //   const contentLengthParsed = contentLength !== null ? +contentLength : 0;

  //   // Step 3: read the data
  //   let receivedLength = 0; // received that many bytes at the moment
  //   let chunks = []; // array of received binary chunks (comprises the body)
  //   while (true) {
  //     const { done, value } = await reader.read();

  //     if (value !== undefined) chunks.push(value);
  //     receivedLength += value ? value.length : 0;

  //     console.log(
  //       `Percentage: ${Math.round(
  //         (receivedLength / contentLengthParsed) * 100
  //       )}%`
  //     );

  //     if (done) {
  //       break;
  //     }
  //   }

    // // Step 4: concatenate chunks into single Uint8Array
    // let chunksAll = new Uint8Array(receivedLength); // (4.1)
    // let position = 0;
    // for (let chunk of chunks) {
    //   chunksAll.set(chunk, position); // (4.2)
    //   position += chunk.length;
    // }

    // let blob = new Blob(chunks);
  }
});

export const reducers = {
  decreaseModelStatusCheckAttempts(state: WorkspaceState) {
    state.modelStatusCheckAttempts--;
  },
  resetModelStatusCheckAttempts(state: WorkspaceState) {
    state.modelStatusCheckAttempts = 3;
  },
  setModelIsLoading(state: WorkspaceState, action: PayloadAction<boolean>) {
    state.downloadingModel = action.payload;
  },
};

export const extraReducers = [
  {
    action: checkModelUpdate.fulfilled,
    reducer: (
      state: WorkspaceState,
      action: PayloadAction<{ iterations: UnparsedIteration[] }>
    ) => {
      const { iterations } = action.payload;
      let updatedEvaluationState = {};
      let latestReadyModelVersion: number | null = null;
      let nextModelShouldBeTraining: boolean = false;
      let modelIsTraining = false;

      const lastModelFailed = iterations.length
        ? iterations[iterations.length - 1]["iteration_status"] === "ERROR"
        : false;

      iterations.reverse().forEach((iteration) => {
        if (latestReadyModelVersion === null) {
          if (iteration["iteration_status"] === "READY") {
            latestReadyModelVersion = iteration["iteration"];
          } else if (
            [
              "PREPARING_DATA",
              "TRAINING",
              "RUNNING_INFERENCE",
              "RUNNING_ACTIVE_LEARNING",
              "CALCULATING_STATISTICS",
            ].includes(iteration["iteration_status"])
          ) {
            modelIsTraining = true;
          }
        }
        if (
          !("lastScore" in updatedEvaluationState) &&
          "estimated_precision" in iteration
        ) {
          updatedEvaluationState = {
            lastScore: iteration["estimated_precision"],
            scoreModelVersion: iteration["iteration"] + 1,
          };
        }
      });

      if (latestReadyModelVersion === null) {
        latestReadyModelVersion = -1;
      }

      // if there is a model available, start counting the version from 1 (not 0)
      if (latestReadyModelVersion !== null && latestReadyModelVersion >= 0) {
        latestReadyModelVersion += 1;
      }

      // logic to manage the next model status, it is first set to true in checkStatus when progress is 100

      // make sure model training indicator isn't shown if there was an error
      if (lastModelFailed) {
        nextModelShouldBeTraining = false;
      } else if (modelIsTraining) {
        // we are sure that a model is being trained
        nextModelShouldBeTraining = true;
      } else {
        // on this branch we have to deduce if there is a model being trained
        // but the frontend is not yet aware of it

        // we are sure that a model is no more training when there is a new ready model version
        nextModelShouldBeTraining =
          latestReadyModelVersion === state.modelVersion
            ? state.nextModelShouldBeTraining
            : false;
      }

      // reset pagination if a new model has been found
      if (
        (state.modelVersion === null && latestReadyModelVersion > 0) ||
        (state.modelVersion !== null &&
          state.modelVersion < latestReadyModelVersion)
      ) {
        const panelsToResetPagination: PanelIdsEnum[] = [
          PanelIdsEnum.LABEL_NEXT,
          PanelIdsEnum.POSITIVE_PREDICTIONS,
          PanelIdsEnum.SUSPICIOUS_LABELS,
          PanelIdsEnum.CONTRADICTING_LABELS,
        ];

        panelsToResetPagination.forEach((pId) => {
          if (pId !== PanelIdsEnum.NOT_SET) {
            state.panels.panels[pId].page = 1;
          }
        });
      }

      state.modelVersion = latestReadyModelVersion;
      state.lastModelFailed = lastModelFailed;
      state.nextModelShouldBeTraining = nextModelShouldBeTraining;
      state.panels.panels[PanelIdsEnum.EVALUATION] = {
        ...state.panels.panels[PanelIdsEnum.EVALUATION],
        ...updatedEvaluationState,
      };
    },
  },
];
