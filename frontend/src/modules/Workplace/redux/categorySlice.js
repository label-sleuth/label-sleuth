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
import { panelIds } from "../../../const";
import { initialState as panelsInitialState } from "./panelsSlice";
import { client } from "../../../api/client";

const getWorkspace_url = `${BASE_URL}/${WORKSPACE_API}`;

export const createCategoryOnServer = createAsyncThunk(
  "workspace/createCategoryOnServer",
  async (request, { getState }) => {
    const state = getState();

    const { category } = request;

    var url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/category`;

    const response = await client.post(url, {
      category_name: category,
      category_description: "",
      update_counter: true,
    });

    return response.data
  }
);

export const deleteCategory = createAsyncThunk(
  "workspace/deleteCategory",
  async (_, { getState }) => {
    const state = getState();

    var url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/category/${state.workspace.curCategory}`;

    const response = await client.delete(url)
    return response.data
  }
);

export const editCategory = createAsyncThunk(
  "workspace/editCategory",
  async ({ newCategoryName, newCategoryDescription }, { getState }) => {
    const state = getState();

    var url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/category/${state.workspace.curCategory}`;

    const body = {
      category_name: newCategoryName,
      category_description: newCategoryDescription,
    };

    const response = await client.put(url, body)
    return response.data
  }
);

export const fetchCategories = createAsyncThunk(
  "workspace/get_all_categories",
  async (_, { getState }) => {
    const state = getState();

    var url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/categories`;
    
    const response = await client.get(url)
    return response.data
  }
);

export const reducers = {
  updateCurCategory(state, action) {
    const c = action.payload;
    return {
      ...state,
      curCategory: c,
      nextModelShouldBeTraining: false,
      // set modelVersion to null to have a way to
      // distiguish between: 1) we don't have model info (null)
      // and there is no model available for cur cat (-1)
      modelVersion: null,
    };
  },
};

export const extraReducers = {
  [fetchCategories.fulfilled]: (state, action) => {
    const data = action.payload;
    state.categories = data["categories"];
  },
  [createCategoryOnServer.fulfilled]: (state, action) => {
    // TODO: action.payload has an update_counter field that is not used, remove it
    return {
      ...state,
      curCategory: action.payload.category_id.toString(),
      categories: [...state.categories, action.payload],
      nextModelShouldBeTraining: false,
    };
  },
  [deleteCategory.pending]: (state, action) => {
    state.deletingCategory = true;
  },
  [deleteCategory.fulfilled]: (state, action) => {
    state.deletingCategory = false;
    state.categories = state.categories.filter(
      (c) => c.category_id != state.curCategory
    );
    state.curCategory = null;
    state.modelVersion = null;
    state.panels.activePanelId = panelIds.SEARCH;
  },
  [editCategory.fulfilled]: (state, action) => {
    const { category_name, category_description } = action.payload;
    state.categories = state.categories.map((c) =>
      c.category_id == state.curCategory
        ? {
            ...c,
            category_name,
            category_description,
          }
        : c
    );
  },
};
