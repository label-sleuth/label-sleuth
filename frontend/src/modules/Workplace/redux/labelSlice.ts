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
import {
  addBOMCharacter,
  getCategoryQueryString,
  getModeQueryParam,
  getQueryParamsString,
  synchronizeElement,
} from "../../../utils/utils";
import {
  BASE_URL,
  WORKSPACE_API,
  DOWNLOAD_LABELS_API,
  UPLOAD_LABELS_API,
} from "../../../config";
import fileDownload from "js-file-download";
import { LabelTypesEnum, PanelIdsEnum, WorkspaceMode } from "../../../const";
import { client } from "../../../api/client";
import { getWorkspaceId } from "../../../utils/utils";
import { RootState } from "../../../store/configureStore";
import {
  Element,
  LabelSliceState,
  ReducerObj,
  UploadedLabels,
  WorkspaceState,
} from "../../../global";

const getWorkspace_url = `${BASE_URL}/${WORKSPACE_API}`;

export const initialState: LabelSliceState = {
  uploadedLabels: null,
  uploadingLabels: false,
  downloadingLabels: false,
  labelCount: {},
};

export const downloadLabels = createAsyncThunk<
  { data: string },
  { labeledOnly: boolean },
  {
    state: RootState;
  }
>("workspace/downloadLabels", async ({ labeledOnly }) => {
  const queryParam = `?labeled_only=${labeledOnly}`;

  const url = `${getWorkspace_url}/${encodeURIComponent(
    getWorkspaceId()
  )}/${DOWNLOAD_LABELS_API}${queryParam}`;

  const { data } = await client.get(url, {
    headers: {
      "Content-Type": "text/csv;charset=UTF-8",
    },
    parseResponseBodyAs: "text",
  });

  return data;
});

export const uploadLabels = createAsyncThunk<
  UploadedLabels,
  FormData,
  {
    state: RootState;
  }
>(`workspace/uploadLabels`, async (formData) => {
  var url = `${getWorkspace_url}/${encodeURIComponent(
    getWorkspaceId()
  )}/${UPLOAD_LABELS_API}`;
  const { data } = await client.post(url, formData, {
    stringifyBody: false,
    omitContentType: true,
  });
  return data;
});

export const setElementLabel = createAsyncThunk<
  void,
  {
    element_id: string;
    label?: string;
    categoryId: number | string | null;
    update_counter: boolean;
    panelId: PanelIdsEnum;
  },
  {
    state: RootState;
  }
>("workspace/set_element_label", async (request, { getState }) => {
  const state = getState();
  const mode = state.workspace.mode;
  const { element_id, label, categoryId, update_counter, panelId } = request;
  const queryParams = getQueryParamsString([
    getCategoryQueryString(categoryId),
    getModeQueryParam(mode),
  ]);
  const url = `${getWorkspace_url}/${encodeURIComponent(
    getWorkspaceId()
  )}/element/${encodeURIComponent(element_id)}${queryParams}`;

  await client.put(url, {
    // category_id is used in binary mode, its undefined in multiclass mode
    category_id:
      mode === WorkspaceMode.BINARY
        ? categoryId !== null
          ? +categoryId
          : null
        : undefined,
    // in multiclass mode the new category is specified in the 'value' attribute, while it is true, false or none in binary mode
    value:
      mode === WorkspaceMode.BINARY
        // label === "true" because the backend expects an actual boolean
        ? label === "none"
          ? undefined
          : label === "true"
        : categoryId === "none" ? undefined : categoryId,
    update_counter: update_counter,
    source: panelId,
    iteration:
      state.workspace.modelVersion !== null &&
      state.workspace.modelVersion !== -1
        ? state.workspace.modelVersion - 1
        : -1,
  });
});

export const reducers = {
  cleanUploadedLabels(state: WorkspaceState, action: PayloadAction<void>) {
    state.uploadedLabels = null;
  },
  updateElementOptimistically(
    state: WorkspaceState,
    action: PayloadAction<{
      element: Element;
      newLabel: LabelTypesEnum | number | null;
      categoryId?: number;
    }>
  ) {
    const { element, newLabel, categoryId } = action.payload;
    const { panelsState } = synchronizeElement(
      element.id,
      newLabel,
      {
        panels: state.panels,
      },
      categoryId !== undefined ? categoryId : null,
      state.mode
    );

    // // add the element to the user labels panel if it is required
    // if (state.panels.activePanelId === PanelIdsEnum.POSITIVE_LABELS) {
    //   if (
    //     newLabel ===
    //     state.panels.panels[PanelIdsEnum.POSITIVE_LABELS].filters?.value
    //   ) {
    //     const positiveElements =
    //       panelsState.panels.panels[PanelIdsEnum.SUSPICIOUS_LABELS].elements;
    //     if (positiveElements !== null) positiveElements[element.id] = element;
    //   }
    // }

    state.panels.panels = panelsState.panels.panels;
  },
  reverseOptimisticUpdate(
    state: WorkspaceState,
    action: PayloadAction<{ element: Element }>
  ) {
    const { element } = action.payload;
    const { panelsState } = synchronizeElement(
      element.id,
      element.userLabel,
      { panels: state.panels },
      1,
      state.mode
    ); // TODO: fiishe
    state.panels.panels = panelsState.panels.panels;
  },
};

export const extraReducers: ReducerObj[] = [
  {
    action: downloadLabels.pending,
    reducer: (state, action) => {
      return {
        ...state,
        downloadingLabels: true,
      };
    },
  },
  {
    action: downloadLabels.fulfilled,
    reducer: (state, action: PayloadAction<string>) => {
      const convertDateSectionToString = (d: number) => {
        return d < 10 ? `0${d}` : `${d}`;
      };

      const data = addBOMCharacter(action.payload);
      const current = new Date();
      const date = `${current.getFullYear()}-${convertDateSectionToString(
        current.getMonth() + 1
      )}-${convertDateSectionToString(current.getDate())}`;
      const time = `${convertDateSectionToString(
        current.getHours()
      )}-${convertDateSectionToString(
        current.getMinutes()
      )}-${convertDateSectionToString(current.getSeconds())}`;
      const fileName = `labeled_data_${date}_${time}.csv`;
      fileDownload(data, fileName);
      return {
        ...state,
        downloadingLabels: false,
      };
    },
  },
  {
    action: downloadLabels.rejected,
    reducer: (state, action) => {
      state.downloadingLabels = false;
    },
  },
  {
    action: uploadLabels.pending,
    reducer: (state, action) => {
      state.uploadingLabels = true;
    },
  },
  {
    action: uploadLabels.fulfilled,
    reducer: (state, action) => {
      return {
        ...state,
        uploadedLabels: action.payload,
        uploadingLabels: false,
      };
    },
  },
  {
    action: uploadLabels.rejected,
    reducer: (state, action) => {
      state.uploadingLabels = false;
    },
  },
  {
    action: setElementLabel.fulfilled,
    reducer: (state, action) => {
      // does nothing, this action is managed by optimistic and reverse updates
    },
  },
];
