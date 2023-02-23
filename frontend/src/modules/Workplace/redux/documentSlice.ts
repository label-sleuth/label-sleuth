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
import { RootState } from "../../../store/configureStore";

const getWorkspace_url = `${BASE_URL}/${WORKSPACE_API}`;

export const initialState: DocumentSliceState = {
  documents: [],
  curDocIndex: null,
};

export const fetchDocumentsMetadata = createAsyncThunk("workspace/fetchDocumentsMetadata", async (_, { getState }) => {
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
    action: fetchDocumentsMetadata.fulfilled,
    reducer: (state, action: PayloadAction<{ documents: { document_id: string }[] }>) => {
      const { documents } = action.payload;
      let parsedDocuments = [...documents.map((d) => ({ documentId: d.document_id }))];
      // select first document by default
      return {
        ...state,
        documents: parsedDocuments,
        curDocIndex: 0,
      };
    },
  },
];

export const currentDocNameSelector = (state: RootState): string | null =>
  state.workspace.curDocIndex !== null ? state.workspace.documents[state.workspace.curDocIndex].documentId : null;
