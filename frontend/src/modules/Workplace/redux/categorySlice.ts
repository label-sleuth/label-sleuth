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
import { PanelIdsEnum, WorkspaceMode } from "../../../const";
import { client } from "../../../api/client";
import {
  badgePalettes,
  getRandomColor,
  getWorkspaceId,
} from "../../../utils/utils";
import { RootState } from "../../../store/configureStore";
import {
  BadgeColor,
  Category,
  CategorySliceState,
  EditCategoryResponse,
  ReducerObj,
  WorkspaceState,
} from "../../../global";

const getWorkspace_url = `${BASE_URL}/${WORKSPACE_API}`;

export const initialCategorySliceState: CategorySliceState = {
  categories: [],
  curCategory: null,
  deletingCategory: false,
};

export const createCategoryOnServer = createAsyncThunk(
  "workspace/createCategoryOnServer",
  async ({
    categoryName,
    categoryDescription,
    categoryColor,
  }: {
    categoryName: string;
    categoryDescription: string;
    categoryColor?: BadgeColor;
  }) => {
    var url = `${getWorkspace_url}/${encodeURIComponent(
      getWorkspaceId()
    )}/category`;
    const response = await client.post(url, {
      category_name: categoryName,
      category_description: categoryDescription,
      update_counter: true,
    });
    return {
      category_name: response.data.category_name,
      category_description: response.data.category_description,
      category_id: response.data.category_id,
      color: categoryColor,
    };
  }
);
interface DeleteCategoryResponse {
  category_id: string;
  workspace_id: string;
}

export const deleteCategory = createAsyncThunk<
  DeleteCategoryResponse,
  void,
  { state: RootState }
>("workspace/deleteCategory", async (_, { getState }) => {
  const state = getState();

  var url = `${getWorkspace_url}/${encodeURIComponent(
    getWorkspaceId()
  )}/category/${state.workspace.curCategory}`;

  const response = await client.delete(url);
  return response.data;
});

export const editCategory = createAsyncThunk<
  EditCategoryResponse,
  { newCategoryName: string; newCategoryDescription: string },
  {
    state: RootState;
  }
>(
  "workspace/editCategory",
  async ({ newCategoryName, newCategoryDescription }, { getState }) => {
    const state = getState();

    var url = `${getWorkspace_url}/${encodeURIComponent(
      getWorkspaceId()
    )}/category/${state.workspace.curCategory}`;

    const body = {
      category_name: newCategoryName,
      category_description: newCategoryDescription,
    };

    const response = await client.put(url, body);
    return response.data;
  }
);

export const fetchCategories = createAsyncThunk(
  "workspace/get_all_categories",
  async () => {
    var url = `${getWorkspace_url}/${encodeURIComponent(
      getWorkspaceId()
    )}/categories`;

    const response = await client.get(url);
    return response.data;
  }
);

export const reducers = {
  updateCurCategory(state: WorkspaceState, action: PayloadAction<number>) {
    const c = action.payload;

    state.curCategory = c;
    state.nextModelShouldBeTraining = false;
    // set modelVersion to null to have a way to
    // distiguish between: 1) we don't have model info (null)
    // and there is no model available for cur cat (-1)
    state.modelVersion = null;
  },
};

export const extraReducers: Array<ReducerObj> = [
  {
    action: fetchCategories.fulfilled,
    reducer: (
      state: WorkspaceState,
      action: PayloadAction<{ categories: Category[] }>
    ) => {
      const data = action.payload;

      state.categories = data["categories"].map((c) => {
        const randomColorName = getRandomColor();
        const badgeColor: BadgeColor = {
          name: randomColorName,
          palette: badgePalettes[randomColorName],
        };
        return {
          ...c,
          color:
            state.mode === WorkspaceMode.MULTICLASS ? badgeColor : undefined,
        };
      });
    },
  },
  {
    action: createCategoryOnServer.fulfilled,
    reducer: (state: WorkspaceState, action: PayloadAction<Category>) => {
      const newCategory: Category = action.payload;

      return {
        ...state,
        curCategory:
          state.mode === WorkspaceMode.BINARY
            ? newCategory.category_id
            : state.curCategory,
        categories: [...state.categories, newCategory],
        nextModelShouldBeTraining: false,
      };
    },
  },
  {
    action: deleteCategory.pending,
    reducer: (state: WorkspaceState) => {
      state.deletingCategory = true;
    },
  },
  {
    action: deleteCategory.fulfilled,
    reducer: (state: WorkspaceState) => {
      state.deletingCategory = false;
      state.categories = state.categories.filter(
        (c: Category) => c.category_id !== state.curCategory
      );
      state.curCategory = null;
      state.modelVersion = null;
      state.panels.activePanelId = PanelIdsEnum.SEARCH;
    },
  },
  {
    action: editCategory.fulfilled,
    reducer: (state: WorkspaceState, action) => {
      const { category_name, category_description } = action.payload;
      state.categories = state.categories.map((c: Category) =>
        c.category_id === state.curCategory
          ? {
              ...c,
              category_name,
              category_description,
            }
          : c
      );
    },
  },
];
