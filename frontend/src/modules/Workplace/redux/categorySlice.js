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
import { handleError } from "../../../utils/utils";
import { initialState as panelsInitialState } from "./panelsSlice";

const getWorkspace_url = `${BASE_URL}/${WORKSPACE_API}`;

export const createCategoryOnServer = createAsyncThunk(
  "workspace/createCategoryOnServer",
  async (request, { getState }) => {
    const state = getState();

    const { category } = request;

    var url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/category`;

    const data = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.authenticate.token}`,
      },
      body: JSON.stringify({
        category_name: category,
        category_description: "",
        update_counter: true,
      }),
      method: "POST",
    })
      .then((response) => response.json())
      .catch((err) => console.log(err));

    return data;
  }
);

export const deleteCategory = createAsyncThunk(
  "workspace/deleteCategory",
  async (request, { getState }) => {
    const state = getState();

    var url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/category/${state.workspace.curCategory}`;

    const data = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.authenticate.token}`,
      },
      method: "DELETE",
    }).then((response) => response.json());

    return data;
  }
);

export const editCategory = createAsyncThunk(
  "workspace/editCategory",
  async ({ newCategoryName, newCategoryDescription }, { getState }) => {
    const state = getState();

    var url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/category/${state.workspace.curCategory}`;

    const body = JSON.stringify({
      category_name: newCategoryName,
      category_description: newCategoryDescription,
    });

    const data = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.authenticate.token}`,
      },
      body: body,
      method: "PUT",
    }).then((response) => response.json());

    return data;
  }
);

export const fetchCategories = createAsyncThunk(
  "workspace/get_all_categories",
  async (request, { getState }) => {
    const state = getState();

    var url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/categories`;

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

export const reducers = {
  updateCurCategory(state, action) {
    const c = action.payload;
    return {
      ...state,
      curCategory: c,
      nextModelShouldBeTraining: false,
    };
  },
};

export const extraReducers = {
  [fetchCategories.fulfilled]: (state, action) => {
    state.categories = action.payload["categories"];
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
  [createCategoryOnServer.rejected]: (state, action) => {
    state.errorMessage = handleError(action.error);
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
    state.panels = {
        ...panelsInitialState.panels,
        activePanelId: panelIds.SEARCH,
        [panelIds.MAIN_PANEL]: panelsInitialState.panels[panelIds.MAIN_PANEL],
    }
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
