import { createAsyncThunk } from "@reduxjs/toolkit";
import { getCategoryQueryString, getQueryParamsString } from "../../../utils/utils";
import { BASE_URL, WORKSPACE_API } from "../../../config"

const getWorkspace_url = `${BASE_URL}/${WORKSPACE_API}`

export const searchKeywords = createAsyncThunk(
  "workspace/searchKeywords",
  async (request, { getState }) => {
    const state = getState();
    const queryParams = getQueryParamsString([
      `qry_string=${state.workspace.searchInput}`,
      getCategoryQueryString(state.workspace.curCategory),
      `sample_start_idx=0`,
    ]);

    var url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/query${queryParams}`;

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
  resetSearchResults(state, _) {
    state.searchResult = null;
  },
  setSearchLabelState(state, action) {
    return {
      ...state,
      searchLabelState: action.payload,
    };
  },
  setSearchInput(state, action) {
    state.searchInput = action.payload;
  },
};

export const extraReducers = {
  [searchKeywords.fulfilled]: (state, action) => {
    const data = action.payload;
    let initialSearchLabelState = {};

    for (let i = 0; i < data["elements"].length; i++) {
      if (state.curCategory in data["elements"][i]["user_labels"]) {
        if (data["elements"][i]["user_labels"][state.curCategory] == "true") {
          initialSearchLabelState["L" + i + "-" + data["elements"][i].id] =
            "pos";
        } else if (
          data["elements"][i]["user_labels"][state.curCategory] == "false"
        ) {
          initialSearchLabelState["L" + i + "-" + data["elements"][i].id] =
            "neg";
        } else {
          initialSearchLabelState["L" + i + "-" + data["elements"][i].id] = "";
        }
      } else {
        initialSearchLabelState["L" + i + "-" + data["elements"][i].id] = "";
      }
    }
    return {
      ...state,
      searchResult: data.elements,
      searchUniqueElemRes: data.hit_count_unique,
      searchTotalElemRes: data.hit_count,
      searchLabelState: initialSearchLabelState,
    };
  },
};
