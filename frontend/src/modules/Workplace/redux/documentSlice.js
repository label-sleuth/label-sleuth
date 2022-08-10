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
import { BASE_URL, WORKSPACE_API } from "../../../config";
import {
  getCategoryQueryString,
  getQueryParamsString,
  parseElements,
} from "../../../utils/utils";

const getWorkspace_url = `${BASE_URL}/${WORKSPACE_API}`;


/**
 * Updates the states when a new document has been fetched
 * @param {the document elements} elements
 * @param {the whole state, only curCategory and labelCount } state
 * @param {the document id, i.g. 4} newDocId
 * @param {the actual document id: i.g. medium-Andean condor} newDocName
 * @returns {the state that has to be updated}
 */
const updateStateAfterFetchingDocument = (
  elements,
  state,
  newDocId,
  newDocName
) => {
  const { initialFocusedState, initialLabelState, documentPos, documentNeg } =
    parseElements(elements, state.curCategory);

  return {
    ...state,
    elements,
    focusedState: initialFocusedState,
    focusedIndex: null,
    labelState: initialLabelState,
    ready: true,
    labelCount: {
      ...state.labelCount,
      documentPos,
      documentNeg,
    },
    curDocId: newDocId,
    curDocName: newDocName,
  };
};

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

export const reducers = {};

export const extraReducers = {
  [fetchDocuments.fulfilled]: (state, action) => {
    const { documents } = action.payload;
    return {
      ...state,
      documents: documents,
      curDocName: documents[0]["document_id"],
      curDocId: 0,
    };
  },
  [fetchElements.fulfilled]: (state, action) => {
    const { elements } = action.payload;

    return {
      ...updateStateAfterFetchingDocument(
        elements,
        state,
        state.curDocId,
        state.curDocName
      ),
    };
  },
  [fetchNextDocElements.fulfilled]: (state, action) => {
    const { elements } = action.payload;
    return {
      ...updateStateAfterFetchingDocument(
        elements,
        state,
        state.curDocId + 1,
        state.documents[state.curDocId + 1]["document_id"]
      ),
    };
  },
  [fetchPrevDocElements.fulfilled]: (state, action) => {
    const { elements } = action.payload;

    return {
      ...updateStateAfterFetchingDocument(
        elements,
        state,
        state.curDocId - 1,
        state.documents[state.curDocId - 1]["document_id"]
      ),
    };
  },
  [fetchCertainDocument.fulfilled]: (state, action) => {
    const { elements } = action.payload.data;

    const curDocument = elements[0]["docid"];
    const newDocId = state.documents.findIndex(
      (d) => d["document_id"] === curDocument
    );

    return {
      ...updateStateAfterFetchingDocument(
        elements,
        state,
        newDocId,
        state["documents"][newDocId]["document_id"]
      ),
    };
  },
};
