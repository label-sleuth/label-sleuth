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
  defaultColor,
  getWorkspaceId,
  returnByMode,
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

export const createCategory = createAsyncThunk(
  "workspace/createCategory",
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
      category_color: categoryColor?.name,
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
  { categoryId: number } | undefined,
  { state: RootState }
>("workspace/deleteCategory", async (param, { getState }) => {
  const state = getState();
  const mode = state.workspace.mode;
  const toDeleteCategoryId =
    mode === WorkspaceMode.BINARY
      ? state.workspace.curCategory
      : param !== undefined && mode === WorkspaceMode.MULTICLASS
      ? param.categoryId
      : null;
  const url = `${getWorkspace_url}/${encodeURIComponent(
    getWorkspaceId()
  )}/category/${toDeleteCategoryId}`;
  const response = await client.delete(url);
  return response.data;
});

export const editCategory = createAsyncThunk<
  EditCategoryResponse,
  {
    newCategoryName: string;
    newCategoryDescription: string;
    newCategoryColor?: BadgeColor;
    categoryId?: number;
  },
  {
    state: RootState;
  }
>(
  "workspace/editCategory",
  async (
    { newCategoryName, newCategoryDescription, newCategoryColor, categoryId },
    { getState }
  ) => {
    const state = getState();
    var url = `${getWorkspace_url}/${encodeURIComponent(
      getWorkspaceId()
    )}/category/${returnByMode(
      state.workspace.curCategory,
      categoryId,
      state.workspace.mode
    )}`;

    console.log(newCategoryColor);
    const body = {
      category_name: newCategoryName,
      category_description: newCategoryDescription,
      category_color: newCategoryColor?.name,
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
    const categories = response.data["categories"];
    categories.forEach((c: any) => {
      c["color"] = c["category_color"]
        ? {
            name: c["category_color"],
            palette: badgePalettes[c["category_color"]],
          }
        : defaultColor;
    });
    return categories;
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
    reducer: (state: WorkspaceState, action: PayloadAction<Category[]>) => {
      const categories = action.payload;

      state.categories = categories.map((c) => {
        const badgeColor: BadgeColor = c.color
          ? {
              name: c.color?.name,
              palette: badgePalettes[c.color?.name],
            }
          : defaultColor;
        return {
          ...c,
          color:
            state.mode === WorkspaceMode.MULTICLASS ? badgeColor : undefined,
        };
      });
    },
  },
  {
    action: createCategory.fulfilled,
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
    action: deleteCategory.rejected,
    reducer: (state: WorkspaceState) => {
      state.deletingCategory = false;
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
    reducer: (
      state: WorkspaceState,
      action: PayloadAction<{ category_id: string }>
    ) => {
      state.deletingCategory = false;

      if (state.mode === WorkspaceMode.BINARY) {
        state.categories = state.categories.filter(
          (c: Category) =>
            // eslint-disable-next-line
            c.category_id.toString() != action.payload.category_id
        );
        state.curCategory = null;
        state.modelVersion = null;
        state.panels.activePanelId = PanelIdsEnum.SEARCH;
      } else if (state.mode === WorkspaceMode.MULTICLASS) {
        const deletedCategory = state.categories.find(
          // eslint-disable-next-line
          (c) => c.category_id.toString() == action.payload.category_id
        ) as Category;
        deletedCategory.deleted = true;
        state.categories = [
          ...state.categories.filter(
            // eslint-disable-next-line
            (c) => c.category_id.toString() != action.payload.category_id
          ),
          deletedCategory,
        ];
      }
    },
  },
  {
    action: editCategory.fulfilled,
    reducer: (state: WorkspaceState, action) => {
      const {
        category_name,
        category_description,
        category_id,
        category_color,
      } = action.payload;
      state.categories = state.categories.map((c: Category) =>
        // eslint-disable-next-line
        c.category_id == category_id
          ? {
              ...c,
              category_name,
              category_description,
              color: {
                name: category_color,
                palette: badgePalettes[category_color],
              },
            }
          : c
      );
    },
  },
];
