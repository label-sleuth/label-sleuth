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

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { BASE_URL } from "../config";
import { client } from "../api/client";
import { CustomizableUITextSliceState } from "../global";
import { CustomizableUITextEnum } from "../const";

const initialState: CustomizableUITextSliceState = {
  loading: false,
  fetched: false,
  texts: Object.fromEntries(
    Object.values(CustomizableUITextEnum).map((k) => [k, ""])
  ) as { [key in CustomizableUITextEnum]: string },
};

export const fetchCustomizableUIText = createAsyncThunk<
  { [key in CustomizableUITextEnum]: string },
  void
>("workspaces/fetchCustomizableUIText", async () => {
  const url = `${BASE_URL}/customizable_ui_text`;
  const { data: customizableUIText } = await client.get(url);
  return customizableUIText;
});

export const featureFlagsSlice = createSlice({
  name: "featureFlags",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomizableUIText.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCustomizableUIText.fulfilled, (state, { payload }) => {
        const customizableUIText = payload;
        return {
          ...state,
          loading: false,
          fetched: true,
          texts: customizableUIText,
        };
      })
      .addCase(fetchCustomizableUIText.rejected, (state, { error }) => {
        state.loading = false;
      });
  },
});

export const customizableUITextReducer = featureFlagsSlice.reducer;


