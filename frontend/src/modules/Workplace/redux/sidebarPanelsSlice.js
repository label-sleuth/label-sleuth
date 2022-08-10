import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getCategoryQueryString,
  getQueryParamsString,
  parseElements,
} from "../../../utils/utils";
import { BASE_URL, WORKSPACE_API, DOWNLOAD_LABELS_API, UPLOAD_LABELS_API } from "../../../config"

const getWorkspace_url = `${BASE_URL}/${WORKSPACE_API}`;

export const getElementToLabel = createAsyncThunk(
  "workspace/getElementToLabel",
  async (request, { getState }) => {
    const state = getState();

    const queryParams = getQueryParamsString([
      getCategoryQueryString(state.workspace.curCategory),
    ]);

    var url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/active_learning${queryParams}`;

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

export const getPositiveElementForCategory = createAsyncThunk(
  "workspace/getPositiveElementForCategory",
  async (request, { getState }) => {
    const state = getState();

    const curDocument =
      state.workspace.documents[state.workspace.curDocId]["document_id"];

    const queryParams = getQueryParamsString([
      getCategoryQueryString(state.workspace.curCategory),
    ]);

    //var url = `${getWorkspace_url}/${state.workspace.workspace}/positive_elements?${getCategoryQueryString(state.workspace.curCategory)}`)

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

export const getAllPositiveLabels = createAsyncThunk(
  "workspace/getPositiveElements",
  async (request, { getState }) => {
    const state = getState();
    const queryParams = getQueryParamsString([
      getCategoryQueryString(state.workspace.curCategory),
    ]);

    const url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/positive_elements${queryParams}`;

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

export const getDisagreementsElements = createAsyncThunk(
  "workspace/getDisagreeElements",
  async (request, { getState }) => {
    const state = getState();

    const queryParams = getQueryParamsString([
      getCategoryQueryString(state.workspace.curCategory),
    ]);

    const url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/disagree_elements${queryParams}`;

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

export const getSuspiciousLabels = createAsyncThunk(
  "workspace/getSuspiciousElements",
  async (request, { getState }) => {
    const state = getState();

    const queryParams = getQueryParamsString([
      getCategoryQueryString(state.workspace.curCategory),
    ]);

    const url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/suspicious_elements${queryParams}`;

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

export const getContradictingLabels = createAsyncThunk(
  "workspace/getContradictiveElements",
  async (request, { getState }) => {
    const state = getState();

    const queryParams = getQueryParamsString([
      getCategoryQueryString(state.workspace.curCategory),
    ]);

    const url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/contradiction_elements${queryParams}`;

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

export const getPositivePredictions = createAsyncThunk(
  "workspace/getPositivePredictions",
  async (request, { getState }) => {
    const state = getState();
    const queryParams = getQueryParamsString([
      `size=100`,
      getCategoryQueryString(state.workspace.curCategory),
      `start_idx=0`,
    ]);
    const url = `${getWorkspace_url}/${encodeURIComponent(
      state.workspace.workspaceId
    )}/positive_predictions${queryParams}`;

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
  setActivePanel(state, action) {
    state.activePanel = action.payload
  },
  setSearchLabelState(state, action) {
    state.searchLabelState = action.payload;
  },
  setRecommendToLabelState(state, action) {
    state.recommendToLabelState = action.payload;
  },
  setPosPredLabelState(state, action) {
    state.posPredLabelState = action.payload;
  },
  setPosElemLabelState(state, action) {
    state.posElemLabelState = action.payload;
  },
  setDisagreeElemLabelState(state, action) {
    state.disagreeElemLabelState = action.payload;
  },
  setSuspiciousElemLabelState(state, action) {
    state.suspiciousElemLabelState = action.payload;
  },
  setContradictiveElemLabelState(state, action) {
    state.contradictiveElemPairsLabelState = action.payload;
  },
};

export const extraReducers = {
  [getPositivePredictions.fulfilled]: (state, action) => {
    const { elements, positive_fraction, hit_count } = action.payload;
    const { initialLabelState } = parseElements(
      elements,
      state.curCategory,
      true
    );
    return {
      ...state,
      posPredResult: elements,
      posPredFraction: positive_fraction,
      posPredTotalElemRes: hit_count,
      posPredLabelState: initialLabelState,
    };
  },
  [getAllPositiveLabels.fulfilled]: (state, action) => {
    const { positive_elements } = action.payload;
    const { initialLabelState } = parseElements(
      positive_elements,
      state.curCategory,
      true
    );

    return {
      ...state,
      posElemResult: positive_elements,
      posElemLabelState: initialLabelState,
    };
  },
  [getDisagreementsElements.fulfilled]: (state, action) => {
    const { disagree_elements } = action.payload;
    const { initialLabelState } = parseElements(
      disagree_elements,
      state.curCategory,
      true
    );

    return {
      ...state,
      disagreeElemResult: disagree_elements,
      disagreeElemLabelState: initialLabelState,
    };
  },
  [getSuspiciousLabels.fulfilled]: (state, action) => {
    const { elements } = action.payload;
    const { initialLabelState } = parseElements(
      elements,
      state.curCategory,
      true
    );

    return {
      ...state,
      suspiciousElemResult: elements,
      suspiciousElemLabelState: initialLabelState,
    };
  },
  [getContradictingLabels.pending]: (state, action) => {
    return {
      ...state,
      loadingContradictingLabels: true,
    };
  },
  [getContradictingLabels.rejected]: (state, action) => {
    return {
      ...state,
      loadingContradictingLabels: false,
    };
  },
  [getContradictingLabels.fulfilled]: (state, action) => {
    const data = action.payload;

    const flattedPairs = data.pairs?.length ? data.pairs.flat() : [];

    const { initialLabelState } = parseElements(
      flattedPairs,
      state.curCategory,
      true
    );

    return {
      ...state,
      contradictiveElemDiffsResult: data.diffs,
      contradictiveElemPairsResult: data.pairs,
      contradictiveElemPairsLabelState: initialLabelState,
      loadingContradictingLabels: false,
    };
  },
  [getElementToLabel.fulfilled]: (state, action) => {
    const data = action.payload;

    let initRecommendToLabelState = {};

    for (let i = 0; i < data["elements"].length; i++) {
      if (state.curCategory in data["elements"][i]["user_labels"]) {
        if (data["elements"][i]["user_labels"][state.curCategory] == "true") {
          initRecommendToLabelState["L" + i + "-" + data["elements"][i].id] =
            "pos";
        } else if (
          data["elements"][i]["user_labels"][state.curCategory] == "false"
        ) {
          initRecommendToLabelState["L" + i + "-" + data["elements"][i].id] =
            "neg";
        } else {
          initRecommendToLabelState["L" + i + "-" + data["elements"][i].id] =
            "";
        }
      } else {
        initRecommendToLabelState["L" + i + "-" + data["elements"][i].id] = "";
      }
    }
    return {
      ...state,
      elementsToLabel: data["elements"],
      recommendToLabelState: initRecommendToLabelState,
    };
  },
  [getPositiveElementForCategory.fulfilled]: (state, action) => {
    const data = action.payload;

    var elements = data["elements"];

    // var doc_elements = [ ... state.elements ]

    var predictionForDocCat = Array(state.elements.length - 1).fill(false);

    elements.map((e, i) => {
      // const docid = e['docid']
      // var eids = e['id'].split('-')
      // const eid = parseInt(eids[eids.length-1])

      // if(docid == state.curDocName) {
      //     // console.log(`eid: ${eid}, i: ${i}`)

      //     predictionForDocCat[eid] = true
      // }

      if (state.curCategory in e["model_predictions"]) {
        const pred = e["model_predictions"][state.curCategory];

        if (pred == "true") {
          predictionForDocCat[i] = true;
        } else {
          predictionForDocCat[i] = false;
        }
      }
    });

    return {
      ...state,
      predictionForDocCat: predictionForDocCat,
    };
  },
};
