import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getCategoryQueryString,
  getQueryParamsString,
  parseElement,
  synchronizeElement,
} from "../../../utils/utils";
import {
  BASE_URL,
  WORKSPACE_API,
  DOWNLOAD_LABELS_API,
  UPLOAD_LABELS_API,
} from "../../../config";
import fileDownload from "js-file-download";
import { panelIds } from "../../../const";
import { client } from "../../../api/client";

const getWorkspace_url = `${BASE_URL}/${WORKSPACE_API}`;

export const downloadLabels = createAsyncThunk(
  "workspace/downloadLabels",
  async (_, { getState }) => {
    const state = getState();

    const url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/${DOWNLOAD_LABELS_API}`;

    const { data } = await client.get(url, {
      headers: {
        "Content-Type": "text/csv;charset=UTF-8",
      },
      parseResponseBodyAs: "text",
    });

    return data;
  }
);

export const uploadLabels = createAsyncThunk(
  `workspace/uploadLabels`,
  async (formData, { getState }) => {
    const state = getState();

    let headers = {
      "Content-Type": "multipart/form-data",
    };

    var url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/${UPLOAD_LABELS_API}`;

    const { data } = await client.post(url, formData, { headers, stringifyBody: false });
    return data;
  }
);

export const labelInfoGain = createAsyncThunk(
  "workspace/labeled_info_gain",
  async (request, { getState }) => {
    const state = getState();

    const queryParams = getQueryParamsString([
      getCategoryQueryString(state.workspace.curCategory),
    ]);

    var url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/labeled_info_gain${queryParams}`;

    const { data } = await client.get(url)
    return data;
  }
);

export const setElementLabel = createAsyncThunk(
  "workspace/set_element_label",
  async (request, { getState }) => {
    const state = getState();

    const { element_id, label, update_counter } = request;

    const queryParams = getQueryParamsString([
      getCategoryQueryString(state.workspace.curCategory),
    ]);

    var url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/element/${encodeURIComponent(element_id)}${queryParams}`;

    const { data } = await client.put(url, {
      category_id: state.workspace.curCategory,
      value: label,
      update_counter: update_counter,
    });
    return data;
  }
);

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
    const date = `${current.getDate()}/${
      current.getMonth() + 1
    }/${current.getFullYear()}`;
    const fileName = `labeleddata_from_Label_Sleuth<${date}>.csv`;
    fileDownload(data, fileName);
    return {
      ...state,
      downloadingLabels: false,
    };
  },
  [uploadLabels.pending]: (state, action) => {
    return {
      ...state,
      uploadingLabels: true,
    };
  },
  [uploadLabels.fulfilled]: (state, action) => {
    return {
      ...state,
      uploadedLabels: action.payload,
      uploadingLabels: false,
    };
  },
  [setElementLabel.fulfilled]: (state, action) => {
    const { element: unparsedElement } = action.payload;
    const element = parseElement(unparsedElement, state.curCategory);

    const panels = synchronizeElement(
      element.id,
      element.userLabel,
      state.panels
    );

    const elements = panels[panelIds.POSITIVE_LABELS].elements;
    if (element.userLabel === "pos") {
      elements[element.id] = element;
    } else if (element.id in elements) {
      delete elements[element.id];
    }
    panels[panelIds.POSITIVE_LABELS].elements = elements;
    state.panels = panels;
  },
};
