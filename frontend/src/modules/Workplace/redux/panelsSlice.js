import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getCategoryQueryString,
  getQueryParamsString,
  parseElements,
} from "../../../utils/utils";
import { BASE_URL, WORKSPACE_API } from "../../../config";
import { panelIds } from "../../../const";
import { getMainPanelElementId } from "../../../utils/utils";
import { client } from "../../../api/client";

/**
 * This file contains the Thunks, reducers, extraReducers and state to 
 * manage the panels. The panels are the main panel and the sidebar panels
 */

const getWorkspace_url = `${BASE_URL}/${WORKSPACE_API}`;

const getPanelElements = async (state, endpoint, extraQueryParams = []) => {
  const queryParams = getQueryParamsString([
    getCategoryQueryString(state.workspace.curCategory),
    ...extraQueryParams,
  ]);

  const url = `${getWorkspace_url}/${encodeURIComponent(
    state.workspace.workspaceId
  )}/${endpoint}${queryParams}`;

  const { data } = await client.get(url);
  return data;
};

/**
 * Updates the states when a new document has been fetched
 * @param {the document elements} elements
 * @param {the whole state, only curCategory and labelCount } state
 * @param {the document id, i.g. 4} newDocId
 * @param {the actual document id: i.g. medium-Andean condor} newDocName
 * @returns {the state that has to be updated}
 */
 const updateStateAfterFetchingDocument = (
  unparsedElements,
  state,
  newDocId,
  newDocName
) => {
  const { elements, documentPos, documentNeg } = parseElements(
    unparsedElements,
    state.curCategory
  );
  return {
    ...state,
    panels: {
      ...state.panels,
      [panelIds.MAIN_PANEL]: {
        elements,
      },
      loading: {
        ...state.panels.loading,
        [panelIds.MAIN_PANEL]: false,
      }
    },
    labelCount: {
      ...state.labelCount,
      documentPos,
      documentNeg,
    },
    curDocId: newDocId,
    curDocName: newDocName,
  };
};

export const fetchDocumentElements = async (state, docId) => {
  return await getPanelElements(state, `document/${encodeURIComponent(docId)}`);
};

export const getElementToLabel = createAsyncThunk(
  "workspace/getElementToLabel",
  async (request, { getState }) => {
    const state = getState();
    return await getPanelElements(state, "active_learning");
  }
);

export const getAllPositiveLabels = createAsyncThunk(
  "workspace/getPositiveElements",
  async (request, { getState }) => {
    const state = getState();
    return await getPanelElements(state, "positive_elements");
  }
);

export const getSuspiciousLabels = createAsyncThunk(
  "workspace/getSuspiciousElements",
  async (request, { getState }) => {
    const state = getState();
    return await getPanelElements(state, "suspicious_elements");
  }
);

export const getContradictingLabels = createAsyncThunk(
  "workspace/getContradictiveElements",
  async (request, { getState }) => {
    const state = getState();
    return await getPanelElements(state, "contradiction_elements");
  }
);

export const getPositivePredictions = createAsyncThunk(
  "workspace/getPositivePredictions",
  async (request, { getState }) => {
    const state = getState();
    return await getPanelElements(state, "positive_predictions", [
      "size=100",
      "start_idx=0",
    ]);
  }
);

export const fetchNextDocElements = createAsyncThunk(
  "workspace/fetchNextDoc",
  async (request, { getState }) => {
    const state = getState();
    const nextDocumentId =
      state.workspace.documents[state.workspace.curDocId + 1]["document_id"];
      return await fetchDocumentElements(state, nextDocumentId)

  }
);

export const fetchPrevDocElements = createAsyncThunk(
  "workspace/fetchPrevDoc",
  async (request, { getState }) => {
    const state = getState();
    const prevDocumentId =
      state.workspace.documents[state.workspace.curDocId - 1]["document_id"];
      return await fetchDocumentElements(state, prevDocumentId)
 }
);

export const fetchElements = createAsyncThunk(
  "workspace/fetchElements",
  async (request, { getState }) => {
    const state = getState();

    const curDocumentId =
      state.workspace.documents[state.workspace.curDocId]["document_id"];
      return await fetchDocumentElements(state, curDocumentId)
  }
);

export const fetchCertainDocument = createAsyncThunk(
  "workspace/fetchCertainDocument",
  async (request, { getState }) => {
    const { docId } = request;
    return await fetchDocumentElements(getState(), docId)
  }
);

export const searchKeywords = createAsyncThunk(
  "workspace/searchKeywords",
  async (useLastSearchString = false, { getState }) => {
    const state = getState();
    const searchString = useLastSearchString
      ? state.workspace.panels[panelIds.SEARCH].lastSearchString
      : state.workspace.panels[panelIds.SEARCH].input;
    return {
      data: await getPanelElements(state, "query", [
        `qry_string=${searchString}`,
        "sample_start_idx=0",
      ]),
      searchString,
    };
  }
);

/**
 * Initial state for the elements object of each panel.
 * The elements object contains key-value pair where each
 * key is an element's id and the value is the information
 * of the specific element (text, id, docId, userLabel and
 * modelPrediction)
 */
const elementsInitialState = {
  elements: null,
};

/**
 * Initial state of the loading state of the sidebar panels.
 * The loading object contains a key-value pair for each 
 * panel. 
 */
const loadingInitialState = {};
Object.values(panelIds).forEach((pId) => (loadingInitialState[pId] = false));


/**
 * The initial state for each of the panels. The key for each panel
 * is the id stored in panelsIds. In addition, it stores two
 * extra fields: the loading field and the activePanelId which holds
 * which is the current active sidebar panel.
 */
export const initialState = {
  panels: {
    loading: loadingInitialState,
    activePanelId: "",
    focusedElement: {
      id: null,
      DOMKey: null,
      hackyToggle: false
    },
    [panelIds.MAIN_PANEL]: {
      ...elementsInitialState,
    },
    [panelIds.SEARCH]: {
      ...elementsInitialState,
      input: null,
      lastSearchString: null,
      hitCount: null,
      uniqueHitCount: null,
    },
    [panelIds.LABEL_NEXT]: {
      ...elementsInitialState,
    },
    [panelIds.POSITIVE_PREDICTIONS]: {
      ...elementsInitialState,
    },
    [panelIds.POSITIVE_LABELS]: {
      ...elementsInitialState,
    },
    [panelIds.SUSPICIOUS_LABELS]: {
      ...elementsInitialState,
    },
    [panelIds.CONTRADICTING_LABELS]: {
      ...elementsInitialState,
      pairs: [],
    },
    [panelIds.EVALUATION]: {
      initialElements: {},
      ...elementsInitialState,
      isInProgress: false,
      lastScore: null,
      scoreModelVersion: null,
    },
  },
};

export const reducers = {
  setActivePanel(state, action) {
    state.panels.activePanelId = action.payload;
  },
  resetSearchResults(state, _) {
    state.panels[panelIds.SEARCH].elements = null;
  },
  setSearchInput(state, action) {
    state.panels[panelIds.SEARCH].input = action.payload;
  },
  resetLastSearchString(state, action) {
    state.panels[panelIds.SEARCH].lastSearchString = null;
  },
  setFocusedElement(state, action) {
    const elementId = action.payload;
    state.panels.focusedElement = {
      id: elementId,
      DOMKey: getMainPanelElementId(elementId),
      hackyToggle: !state.panels.focusedElement.hackyToggle,
    }
  },
};

export const extraReducers = {
  // Positive predictions panel extra reducers
  [getPositivePredictions.pending]: (state, action) => {
    state.panels.loading[panelIds.POSITIVE_PREDICTIONS] = true;
  },
  [getPositivePredictions.fulfilled]: (state, action) => {
    const {
      elements: unparsedElements,
    } = action.payload;
    const { elements } = parseElements(unparsedElements, state.curCategory);
    state.panels.loading[panelIds.POSITIVE_PREDICTIONS] = false;
    state.panels[panelIds.POSITIVE_PREDICTIONS].elements = elements;
  },

  // Positive labels panel extra reducers
  [getAllPositiveLabels.pending]: (state, action) => {
    state.panels.loading[panelIds.POSITIVE_LABELS] = true;
  },
  [getAllPositiveLabels.fulfilled]: (state, action) => {
    const { positive_elements: unparsedElements } = action.payload;
    const { elements } = parseElements(unparsedElements, state.curCategory);
    state.panels.loading[panelIds.POSITIVE_LABELS] = false;
    state.panels[panelIds.POSITIVE_LABELS].elements = elements;
  },

  // Positive predictions panel extra reducers
  [getSuspiciousLabels.pending]: (state, action) => {
    state.panels.loading[panelIds.SUSPICIOUS_LABELS] = true;
  },
  [getSuspiciousLabels.fulfilled]: (state, action) => {
    const { elements: unparsedElements } = action.payload;
    const { elements } = parseElements(unparsedElements, state.curCategory);
    state.panels.loading[panelIds.SUSPICIOUS_LABELS] = false;
    state.panels[panelIds.SUSPICIOUS_LABELS].elements = elements;
  },

  // Contradicting labels panel extra reducers
  [getContradictingLabels.pending]: (state, action) => {
    state.panels.loading[panelIds.CONTRADICTING_LABELS] = true;
  },
  [getContradictingLabels.rejected]: (state, action) => {
    state.panels.loading[panelIds.CONTRADICTING_LABELS] = false;
  },
  [getContradictingLabels.fulfilled]: (state, action) => {
    const { pairs } = action.payload;

    const flattedPairs = pairs?.length ? pairs.flat() : [];

    const { elements } = parseElements(flattedPairs, state.curCategory);

    state.panels.loading[panelIds.CONTRADICTING_LABELS] = false;
    state.panels[panelIds.CONTRADICTING_LABELS] = {
      ...state.panels[panelIds.CONTRADICTING_LABELS],
      elements,
      pairs: pairs.map((pair) => pair.map((element) => element.id)),
    };
  },

  // Label next panel extra reducers
  [getElementToLabel.pending]: (state, action) => {
    state.panels.loading[panelIds.LABEL_NEXT] = true;
  },
  [getElementToLabel.fulfilled]: (state, action) => {
    const { elements: unparsedElements } = action.payload;
    const { elements } = parseElements(unparsedElements, state.curCategory);

    state.panels.loading[panelIds.LABEL_NEXT] = false;
    state.panels[panelIds.LABEL_NEXT].elements = elements;
  },

  // Search panel extra reducers
  [searchKeywords.pending]: (state, action) => {
    state.panels.loading[panelIds.SEARCH] = true;
  },
  [searchKeywords.fulfilled]: (state, action) => {
    const { data, searchString } = action.payload;
    const {
      elements: unparsedElements,
      hit_count_unique: uniqueHitCount,
      hit_count: hitCount,
    } = data;

    const { elements } = parseElements(unparsedElements, state.curCategory);

    state.panels.loading[panelIds.SEARCH] = false;
    state.panels[panelIds.SEARCH] = {
      ...state.panels[panelIds.SEARCH],
      elements,
      uniqueHitCount,
      hitCount,
      lastSearchString: searchString,
    };
  },
  
  // Main panel extra reducers
  [fetchElements.pending]: (state, action) => {
    state.panels.loading[panelIds.MAIN_PANEL] = true;
  },
  [fetchElements.fulfilled]: (state, action) => {
    const { elements } = action.payload;
    return updateStateAfterFetchingDocument(
      elements,
      state,
      state.curDocId,
      state.curDocName
    );
  },
  [fetchNextDocElements.pending]: (state, action) => {
    state.panels.loading[panelIds.MAIN_PANEL] = true;
  },
  [fetchNextDocElements.fulfilled]: (state, action) => {
    const { elements } = action.payload;

    return updateStateAfterFetchingDocument(
      elements,
      state,
      state.curDocId + 1,
      state.documents[state.curDocId + 1]["document_id"]
    );
  },
  [fetchPrevDocElements.pending]: (state, action) => {
    state.panels.loading[panelIds.MAIN_PANEL] = true;
  },
  [fetchPrevDocElements.fulfilled]: (state, action) => {
    const { elements } = action.payload;

    return updateStateAfterFetchingDocument(
      elements,
      state,
      state.curDocId - 1,
      state.documents[state.curDocId - 1]["document_id"]
    );
  },
  [fetchCertainDocument.pending]: (state, action) => {
    state.panels.loading[panelIds.MAIN_PANEL] = true;
  },
  [fetchCertainDocument.fulfilled]: (state, action) => {
    const { elements } = action.payload;

    const curDocument = elements[0]["docid"];
    const newDocId = state.documents.findIndex(
      (d) => d["document_id"] === curDocument
    );

    return updateStateAfterFetchingDocument(
      elements,
      state,
      newDocId,
      state["documents"][newDocId]["document_id"]
    );
  },
};
