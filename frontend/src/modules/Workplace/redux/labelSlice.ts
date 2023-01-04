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
import { getCategoryQueryString, getPageCount, getQueryParamsString, synchronizeElement } from "../../../utils/utils";
import { BASE_URL, WORKSPACE_API, DOWNLOAD_LABELS_API, UPLOAD_LABELS_API } from "../../../config";
import fileDownload from "js-file-download";
import { LabelTypesEnum, PanelIdsEnum } from "../../../const";
import { client } from "../../../api/client";
import { getWorkspaceId } from "../../../utils/utils";
import { RootState } from "../../../store/configureStore";
import { Element, LabelDiff, LabelSliceState, ReducerObj, WorkspaceState } from "../../../global";

const getWorkspace_url = `${BASE_URL}/${WORKSPACE_API}`;

export const initialState: LabelSliceState = {
  uploadedLabels: null,
  uploadingLabels: false,
  downloadingLabels: false,
  labelCount: {
    workspacePos: 0,
    workspaceNeg: 0,
    documentPos: 0,
    documentNeg: 0,
  },
};

export const downloadLabels = createAsyncThunk<RootState, { labeledOnly: boolean }>(
  "workspace/downloadLabels",
  async ({ labeledOnly }, { getState }) => {
    const queryParam = `?labeled_only=${labeledOnly}`;

    const url = `${getWorkspace_url}/${encodeURIComponent(getWorkspaceId())}/${DOWNLOAD_LABELS_API}${queryParam}`;

    const { data } = await client.get(url, {
      headers: {
        "Content-Type": "text/csv;charset=UTF-8",
      },
      parseResponseBodyAs: "text",
    });

    return data;
  }
);

export const uploadLabels = createAsyncThunk(`workspace/uploadLabels`, async (formData, { getState }) => {
  var url = `${getWorkspace_url}/${encodeURIComponent(getWorkspaceId())}/${UPLOAD_LABELS_API}`;
  const { data } = await client.post(url, formData, {
    stringifyBody: false,
    omitContentType: true,
  });
  return data;
});

export const setElementLabel = createAsyncThunk<
  void,
  { element_id: string; label: string; update_counter: boolean },
  {
    state: RootState;
  }
>("workspace/set_element_label", async (request, { getState }) => {
  const state = getState();

  const { element_id, label, update_counter } = request;

  const queryParams = getQueryParamsString([getCategoryQueryString(state.workspace.curCategory)]);

  var url = `${getWorkspace_url}/${encodeURIComponent(getWorkspaceId())}/element/${encodeURIComponent(
    element_id
  )}${queryParams}`;

  await client.put(url, {
    category_id: state.workspace.curCategory,
    value: label,
    update_counter: update_counter,
  });
});

export const reducers = {
  updateDocumentLabelCountByDiff(state: WorkspaceState, action: PayloadAction<LabelDiff>) {
    const diff = action.payload;
    state.labelCount = {
      ...state.labelCount,
      documentPos: state.labelCount.documentPos + diff.pos,
      documentNeg: state.labelCount.documentNeg + diff.neg,
    };
  },
  cleanUploadedLabels(state: WorkspaceState, action: PayloadAction<void>) {
    state.uploadedLabels = null;
  },
  updateElementOptimistically(
    state: WorkspaceState,
    action: PayloadAction<{ element: Element; newLabel: LabelTypesEnum; sidebarPanelElementsPerPage: number }>
  ) {
    const { element, newLabel, sidebarPanelElementsPerPage } = action.payload;
    const updatedElement = {
      ...element,
      userLabel: newLabel,
    };
    const { panelsState, previousLabel } = synchronizeElement(updatedElement.id, updatedElement.userLabel, {
      panels: state.panels,
    });
    const panels = panelsState.panels.panels;
    // Positive labels panel management
    const { elements, page, hitCount } = panels[PanelIdsEnum.POSITIVE_LABELS];
    let elementsCopy = { ...elements };

    // have to do something if:
    // - positive labels panels is active
    if (panelsState.panels.activePanelId === PanelIdsEnum.POSITIVE_LABELS) {
      // - label is pos,
      if (updatedElement.userLabel === "pos") {
        if (panels[PanelIdsEnum.POSITIVE_LABELS].hitCount !== null) {
          panels[PanelIdsEnum.POSITIVE_LABELS].hitCount += 1;
        }
        if (elements === null) {
          elementsCopy = {};
        }
        // - last page is not full
        if (Object.keys(elementsCopy).length < sidebarPanelElementsPerPage) {
          // - and if it is in the last page add it to the last page
          const positiveLabelsPanelPageCount = getPageCount(sidebarPanelElementsPerPage, hitCount);
          if (positiveLabelsPanelPageCount === page) {
            elementsCopy[element.id] = updatedElement;
          }
        }
      }
      // if element was positive label
      // update hitCount and remove it if it is in the current page
      else if (previousLabel === "pos") {
        // manually manage case where labeled element
        // is present in the current page
        const positiveLabelsPanelPageCount = getPageCount(sidebarPanelElementsPerPage, hitCount);
        if (
          elements !== null &&
          updatedElement.id in elements &&
          Object.keys(elements).length === 1 &&
          page === positiveLabelsPanelPageCount
        ) {
          panels[PanelIdsEnum.POSITIVE_LABELS].page = page - 1;
        }
        // mechanism is too complex when elements are removed from another page
        // lets refetch for the moment :)
        state.panels.refetch = true;
      }
    }

    panels[PanelIdsEnum.POSITIVE_LABELS].elements = elements;
    state.panels.panels = panels;
  },
  reverseOptimisticUpdate(
    state: WorkspaceState,
    action: PayloadAction<{ element: Element; sidebarPanelElementsPerPage: number }>
  ) {
    const { element, sidebarPanelElementsPerPage } = action.payload;
    const { panelsState, previousLabel } = synchronizeElement(element.id, element.userLabel, { panels: state.panels });
    const panels = panelsState.panels.panels;
    // Positive labels panel management
    const { elements, page, hitCount } = panels[PanelIdsEnum.POSITIVE_LABELS];
    let elementsCopy = { ...elements };
    // have to do something if:
    // - positive labels panels is active
    if (panelsState.panels.activePanelId === PanelIdsEnum.POSITIVE_LABELS) {
      // - label is pos,
      if (element.userLabel === "pos") {
        if (panels[PanelIdsEnum.POSITIVE_LABELS].hitCount !== null) {
          panels[PanelIdsEnum.POSITIVE_LABELS].hitCount += 1;
        }
        if (elements === null) {
          elementsCopy = {};
        }
        // - last page is not full
        if (Object.keys(elementsCopy).length < sidebarPanelElementsPerPage) {
          // - and if it is in the last page add it to the last page
          const positiveLabelsPanelPageCount = getPageCount(sidebarPanelElementsPerPage, hitCount);
          if (positiveLabelsPanelPageCount === page) {
            elementsCopy[element.id] = element;
          }
        }
      }
      // if element was positive label
      // update hitCount and remove it if it is in the current page
      else if (previousLabel === "pos") {
        // manually manage case where labeled element
        // is present in the current page
        const positiveLabelsPanelPageCount = getPageCount(sidebarPanelElementsPerPage, hitCount);
        if (
          elements !== null &&
          element.id in elements &&
          Object.keys(elements).length === 1 &&
          page === positiveLabelsPanelPageCount
        ) {
          panels[PanelIdsEnum.POSITIVE_LABELS].page = page - 1;
        }
        // mechanism is too complex when elements are removed from another page
        // lets refetch for the moment :)
        panelsState.panels.refetch = true;
      }
    }

    panels[PanelIdsEnum.POSITIVE_LABELS].elements = elements;
    state.panels.panels = panels;
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
    reducer: (state, action) => {

      const convertDateSectionToString = (d: number) => {
        return d < 10 ? `0${d}` : `${d}`
      }

      const data = action.payload;
      const current = new Date();
      const date = `${current.getFullYear()}-${convertDateSectionToString(current.getMonth() + 1)}-${convertDateSectionToString(current.getDate())}`;
      const time = `${convertDateSectionToString(current.getHours())}-${convertDateSectionToString(current.getMinutes())}-${convertDateSectionToString(current.getSeconds())}`
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
