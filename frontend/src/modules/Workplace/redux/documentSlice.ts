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
import { BASE_URL, WORKSPACE_API } from "../../../config";
import { client } from "../../../api/client";
import { getWorkspaceId } from "../../../utils/utils";
import { DocumentSliceState, ReducerObj } from "../../../global";

const getWorkspace_url = `${BASE_URL}/${WORKSPACE_API}`;

export const initialState: DocumentSliceState = {
  curDocIndex: 0,
  documents: [],
  isDocLoaded: false,
  curDocName: "",
}

export const fetchDocuments = createAsyncThunk("workspace/fetchDocuments", async (_, { getState }) => {
  const url = `${getWorkspace_url}/${encodeURIComponent(getWorkspaceId())}/documents`;
  const { data } = await client.get(url);
  return data;
});

export const preloadDataset = createAsyncThunk("workspace/preloadDataset", async (_, { getState }) => {
  const url = `${getWorkspace_url}/${encodeURIComponent(getWorkspaceId())}/load_dataset`;
  await client.post(url);
});

export const reducers = {};

export const extraReducers: Array<ReducerObj> = [
  {
    action: fetchDocuments.pending,
    reducer: (state, action) => {
      state.isDocLoaded = false;
    },
  },
  {
    action: fetchDocuments.fulfilled,
    reducer: (state, action: PayloadAction<{documents: {document_id: string}[]}>) => {
      const { documents } = action.payload;
      let parsedDocuments = [...documents.map(d => ({documentId: d.document_id}))]
      return {
        ...state,
        documents: parsedDocuments,
        isDocLoaded: true,
        curDocName: parsedDocuments[0].documentId,
        curDocIndex: 0,
      };
    },
  },
];
