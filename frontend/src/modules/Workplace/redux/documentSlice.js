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
  BASE_URL,
  WORKSPACE_API,
} from "../../../config";
import {
  getCategoryQueryString,
  getQueryParamsString,
} from "../../../utils/utils";

export { searchKeywords } from "./searchSlice";

const getWorkspace_url = `${BASE_URL}/${WORKSPACE_API}`;

export const fetchDocuments = createAsyncThunk(
  "workspace/fetchDocuments",
  async (request, { getState }) => {
    const state = getState();
    var url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/documents`;

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

export const fetchNextDocElements = createAsyncThunk(
  "workspace/fetchNextDoc",
  async (request, { getState }) => {
    const state = getState();

    const curDocument =
      state.workspace.documents[state.workspace.curDocId + 1]["document_id"];

    const queryParams = getQueryParamsString([
      getCategoryQueryString(state.workspace.curCategory),
    ]);

    var url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/document/${encodeURIComponent(curDocument)}${queryParams}`;

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

export const fetchPrevDocElements = createAsyncThunk(
  "workspace/fetchPrevDoc",
  async (request, { getState }) => {
    const state = getState();

    const curDocument =
      state.workspace.documents[state.workspace.curDocId - 1]["document_id"];

    const queryParams = getQueryParamsString([
      getCategoryQueryString(state.workspace.curCategory),
    ]);

    var url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/document/${encodeURIComponent(curDocument)}${queryParams}`;

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

export const fetchElements = createAsyncThunk(
  "workspace/fetchElements",
  async (request, { getState }) => {
    const state = getState();

    const curDocument =
      state.workspace.documents[state.workspace.curDocId]["document_id"];

    var url = null;

    const queryParams = getQueryParamsString([
      getCategoryQueryString(state.workspace.curCategory),
    ]);
    url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/document/${encodeURIComponent(curDocument)}${queryParams}`;

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

export const fetchCertainDocument = createAsyncThunk(
  "workspace/fetchCertainDocument",
  async (request, { getState }) => {
    // if(!state.workspace.curCategory){
    //     throw Error("No category was selected!")
    // }
    const state = getState();

    const { docid, eid, switchStatus } = request;

    const queryParams = getQueryParamsString([
      getCategoryQueryString(state.workspace.curCategory),
    ]);

    var url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/document/${encodeURIComponent(docid)}${queryParams}`;

    const data = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.authenticate.token}`,
      },
      method: "GET",
    }).then((response) => {
      var data = response.json();
      data["eid"] = eid;
      return data;
    });

    return { data, eid, switchStatus };
  }
);

export const reducers = {}
  
/**
 * Parses the elements of a document extracting the user labels
 * @param {list of elements of a document} elements 
 * @param {The current selected category} curCategory 
 * @returns 
 */
const parseElements = (elements, curCategory) => {
  
  var initialFocusedState = {};
  
  var initialLabelState = {};

  var pos_label = 0;

  var neg_label = 0;

  for (const [i, element] of elements.entries()) {
    initialFocusedState["L" + i] = false;
    const userLabels = element['user_labels']
    if (curCategory in userLabels) {
      if (userLabels[curCategory] == "true") {
        initialLabelState["L" + i] = "pos";
        pos_label += 1;
      } else if (
        userLabels[curCategory] == "false"
      ) {
        initialLabelState["L" + i] = "neg";
        neg_label += 1;
      }
    } else {
      initialLabelState["L" + i] = "";
    }
  }
  return {
    initialFocusedState,
    initialLabelState,
    pos_label,
    neg_label
  }
}

export const extraReducers = {
  [fetchElements.fulfilled]: (state, action) => {
    const { elements } = action.payload;

    const {
      initialFocusedState,
      initialLabelState,
      pos_label,
      neg_label
    } = parseElements(elements, state.curCategory)

    return {
      ...state,
      elements,
      focusedState: initialFocusedState,
      focusedIndex: null,
      labelState: initialLabelState,
      ready: true,
      pos_label_num_doc: pos_label,
      neg_label_num_doc: neg_label,
    };
  },
  [fetchDocuments.fulfilled]: (state, action) => {
    const { documents } = action.payload;
    return {
      ...state,
      documents: documents,
      curDocName: documents[0]["document_id"],
      curDocId: 0,
    };
  },
  [fetchNextDocElements.fulfilled]: (state, action) => {
    const { elements } = action.payload;
    const {
      initialFocusedState,
      initialLabelState,
      pos_label,
      neg_label
    } = parseElements(elements, state.curCategory)

    return {
      ...state,
      elements,
      focusedState: initialFocusedState,
      focusedIndex: null,
      labelState: initialLabelState,
      ready: true,
      pos_label_num_doc: pos_label,
      neg_label_num_doc: neg_label,

      curDocId: state.curDocId + 1,
      curDocName: state.documents[state.curDocId + 1]["document_id"],
    };
  },
  [fetchPrevDocElements.fulfilled]: (state, action) => {
    const { elements } = action.payload;
    const {
      initialFocusedState,
      initialLabelState,
      pos_label,
      neg_label
    } = parseElements(elements, state.curCategory)

    return {
      ...state,
      elements,
      focusedState: initialFocusedState,
      focusedIndex: null,
      labelState: initialLabelState,
      ready: true,
      pos_label_num_doc: pos_label,
      neg_label_num_doc: neg_label,

      curDocId: state.curDocId + 1,
      curDocName: state.documents[state.curDocId - 1]["document_id"],
    };
  },
  [fetchCertainDocument.fulfilled]: (state, action) => {
    const { elements } = action.payload.data;

    const {
      initialFocusedState,
      initialLabelState,
      pos_label,
      neg_label
    } = parseElements(elements, state.curCategory)

    const curDocument = elements[0]["docid"];
    const newDocId = state.documents.findIndex(d => d['document_id'] === curDocument)

    return {
      ...state,
      elements,
      focusedState: initialFocusedState,
      focusedIndex: null,
      labelState: initialLabelState,
      ready: true,
      pos_label_num_doc: pos_label,
      neg_label_num_doc: neg_label,

      curDocId: newDocId,
      curDocName: state["documents"][newDocId]["document_id"],
    };
  },
};
