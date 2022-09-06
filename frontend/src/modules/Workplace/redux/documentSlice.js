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
import { client } from "../../../api/client";

const getWorkspace_url = `${BASE_URL}/${WORKSPACE_API}`;

export const fetchDocuments = createAsyncThunk(
  "workspace/fetchDocuments",
  async (_, { getState }) => {
    const state = getState();
    var url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/documents`;

    const { data } = await client.get(url);
    return data;
  }
);

export const reducers = {
  updateMainPanelElement(state, action) {
    const { elementId, userLabel } = action.payload;
    state.elementsDict[elementId].userLabel = userLabel;
  },
};

export const extraReducers = {
  [fetchDocuments.pending]: (state, action) => {
    state.isDocLoaded = false;
  },
  [fetchDocuments.fulfilled]: (state, action) => {
    const { documents } = action.payload;

    return {
      ...state,
      documents: documents,
      isDocLoaded: true,
      curDocName: documents[0]["document_id"],
      curDocId: 0,
    };
  },
};
