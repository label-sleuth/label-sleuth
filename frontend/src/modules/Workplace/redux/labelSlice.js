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

import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getCategoryQueryString,
  getPageCount,
  getQueryParamsString,
  synchronizeElement,
} from "../../../utils/utils";
import { BASE_URL, WORKSPACE_API, DOWNLOAD_LABELS_API, UPLOAD_LABELS_API } from "../../../config";
import fileDownload from "js-file-download";
import { panelIds } from "../../../const";
import { client } from "../../../api/client";
import { getWorkspaceId } from "../../../utils/utils";

const getWorkspace_url = `${BASE_URL}/${WORKSPACE_API}`;

export const downloadLabels = createAsyncThunk("workspace/downloadLabels", async ({ labeledOnly }, { getState }) => {
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

export const uploadLabels = createAsyncThunk(`workspace/uploadLabels`, async (formData, { getState }) => {
  var url = `${getWorkspace_url}/${encodeURIComponent(getWorkspaceId())}/${UPLOAD_LABELS_API}`;
  const { data } = await client.post(url, formData, {
    stringifyBody: false,
    omitContentType: true,
  });
  return data;
});

export const labelInfoGain = createAsyncThunk("workspace/labeled_info_gain", async (request, { getState }) => {
  const state = getState();

  const queryParams = getQueryParamsString([getCategoryQueryString(state.workspace.curCategory)]);

  var url = `${getWorkspace_url}/${encodeURIComponent(getWorkspaceId())}/labeled_info_gain${queryParams}`;

  const { data } = await client.get(url);
  return data;
});

export const setElementLabel = createAsyncThunk("workspace/set_element_label", async (request, { getState }) => {
  const state = getState();

  const { element_id, label, update_counter } = request;

  const queryParams = getQueryParamsString([getCategoryQueryString(state.workspace.curCategory)]);

  var url = `${getWorkspace_url}/${encodeURIComponent(getWorkspaceId())}/element/${encodeURIComponent(
    element_id
  )}${queryParams}`;

  const { data } = await client.put(url, {
    category_id: state.workspace.curCategory,
    value: label,
    update_counter: update_counter,
  });

  const sidebarPanelElementsPerPage = state.featureFlags.sidebarPanelElementsPerPage;
  return { data, sidebarPanelElementsPerPage };
});

export const reducers = {
  setNumLabelGlobal(state, action) {
    return {
      ...state,
      numLabelGlobal: action.payload,
    };
  },
  setNumLabel(state, action) {
    return {
      ...state,
      numLabel: action.payload,
    };
  },
  setLabelState(state, action) {
    const new_labeled_state = action.payload;

    return {
      ...state,
      labelState: new_labeled_state,
    };
  },
  updateDocumentLabelCountByDiff(state, action) {
    const diff = action.payload;
    return {
      ...state,
      labelCount: {
        ...state.labelCount,
        documentPos: state.labelCount.documentPos + diff.pos,
        documentNeg: state.labelCount.documentNeg + diff.neg,
      },
    };
  },
  cleanUploadedLabels(state, action) {
    state.uploadedLabels = null;
  },
  updateElementOptimistically(state, action) {
    const { element, newLabel, sidebarPanelElementsPerPage } = action.payload;
    const updatedElement = {
      ...element,
      userLabel: newLabel,
    }
    const { panels, previousLabel } = synchronizeElement(updatedElement.id, updatedElement.userLabel, state.panels);

    // Positive labels panel management
    const { elements, page, hitCount } = panels[panelIds.POSITIVE_LABELS];
    let elementsCopy = {...elements};

    // have to do something if:
    // - positive labels panels is active
    if (panels.activePanelId === panelIds.POSITIVE_LABELS) {
      // - label is pos,
      if (updatedElement.userLabel === "pos") {
        panels[panelIds.POSITIVE_LABELS].hitCount += 1;
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
        if (updatedElement.id in elements && Object.keys(elements).length === 1 && page === positiveLabelsPanelPageCount) {
          panels[panelIds.POSITIVE_LABELS].page = page - 1;
        }
        // mechanism is too complex when elements are removed from another page
        // lets refetch for the moment :)
        panels.refetch = true;
      }
    }

    panels[panelIds.POSITIVE_LABELS].elements = elements;
    state.panels = panels;
  },
  reverseOptimisticUpdate(state, action) {
    const { element, sidebarPanelElementsPerPage } = action.payload;
    const { panels, previousLabel } = synchronizeElement(element.id, element.userLabel, state.panels);

    // Positive labels panel management
    const { elements, page, hitCount } = panels[panelIds.POSITIVE_LABELS];
    let elementsCopy = {...elements};
    // have to do something if:
    // - positive labels panels is active
    if (panels.activePanelId === panelIds.POSITIVE_LABELS) {
      // - label is pos,
      if (element.userLabel === "pos") {
        panels[panelIds.POSITIVE_LABELS].hitCount += 1;
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
        if (element.id in elements && Object.keys(elements).length === 1 && page === positiveLabelsPanelPageCount) {
          panels[panelIds.POSITIVE_LABELS].page = page - 1;
        }
        // mechanism is too complex when elements are removed from another page
        // lets refetch for the moment :)
        panels.refetch = true;
      }
    }

    panels[panelIds.POSITIVE_LABELS].elements = elements;
    state.panels = panels;
  }
};

export const extraReducers = {
  [downloadLabels.pending]: (state, action) => {
    return {
      ...state,
      downloadingLabels: true,
    };
  },
  [downloadLabels.fulfilled]: (state, action) => {
    const data = action.payload;
    const current = new Date();
    const date = `${current.getDate()}/${current.getMonth() + 1}/${current.getFullYear()}`;
    const fileName = `labeleddata_from_Label_Sleuth<${date}>.csv`;
    fileDownload(data, fileName);
    return {
      ...state,
      downloadingLabels: false,
    };
  },
  [downloadLabels.rejected]: (state, action) => {
    state.downloadingLabels = false;
  },
  [uploadLabels.pending]: (state, action) => {
    state.uploadingLabels = true;
  },
  [uploadLabels.fulfilled]: (state, action) => {
    return {
      ...state,
      uploadedLabels: action.payload,
      uploadingLabels: false,
    };
  },
  [uploadLabels.rejected]: (state, action) => {
    state.uploadingLabels = false;
  },
  [setElementLabel.fulfilled]: (state, action) => {
  },
};
