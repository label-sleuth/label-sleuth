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
import { getCategoryQueryString, getQueryParamsString, parseElements } from "../../../utils/utils";
import { BASE_URL, WORKSPACE_API } from "../../../config";
import { panelIds } from "../../../const";
import { getPanelDOMKey } from "../../../utils/utils";
import { client } from "../../../api/client";
import { getElementIndex } from "../../../utils/utils";
import { getWorkspaceId } from "../../../utils/utils";
//import { current } from "@reduxjs/toolkit";

/**
 * This file contains the Thunks, reducers, extraReducers and state to
 * manage the panels. The panels are the main panel and the sidebar panels
 */
const getWorkspace_url = `${BASE_URL}/${WORKSPACE_API}`;

const getPanelElements = async (
  state,
  endpoint,
  extraQueryParams = [],
  pagination = { startIndex: 0, elementsPerPage: null }
) => {
  pagination.startIndex !== null && extraQueryParams.push(`start_idx=${pagination.startIndex}`);
  pagination.elementsPerPage !== null && extraQueryParams.push(`size=${pagination.elementsPerPage}`);

  const queryParams = getQueryParamsString([getCategoryQueryString(state.workspace.curCategory), ...extraQueryParams]);

  const url = `${getWorkspace_url}/${encodeURIComponent(getWorkspaceId())}/${endpoint}${queryParams}`;

  const { data } = await client.get(url);
  return data;
};

export const getElementToLabel = createAsyncThunk(
  "workspace/getElementToLabel",
  async ({ pagination }, { getState }) => {
    const state = getState();
    return await getPanelElements(state, "active_learning", [], pagination);
  }
);

export const getAllPositiveLabels = createAsyncThunk(
  "workspace/getPositiveElements",
  async ({ pagination }, { getState }) => {
    const state = getState();
    return await getPanelElements(state, "positive_elements", [], pagination);
  }
);

export const getSuspiciousLabels = createAsyncThunk(
  "workspace/getSuspiciousElements",
  async ({ pagination }, { getState }) => {
    const state = getState();
    return await getPanelElements(state, "suspicious_elements", [], pagination);
  }
);

export const getContradictingLabels = createAsyncThunk(
  "workspace/getContradictiveElements",
  async ({ pagination }, { getState }) => {
    const state = getState();
    return await getPanelElements(state, "contradiction_elements", [], pagination);
  }
);

export const getPositivePredictions = createAsyncThunk(
  "workspace/getPositivePredictions",
  async ({ pagination }, { getState }) => {
    const state = getState();
    return await getPanelElements(state, "positive_predictions", [], pagination);
  }
);

export const fetchDocumentElements = createAsyncThunk(
  "workspace/fetchDocumentElements",
  async (params, { getState }) => {
    let docId;
    const state = getState();
    if (!("docId" in params)) {
      docId = state.workspace.curDocName;
    } else {
      docId = params.docId;
    }
    return await getPanelElements(state, `document/${encodeURIComponent(docId)}`, [], params.pagination);
  }
);

export const searchKeywords = createAsyncThunk(
  "workspace/searchKeywords",
  async ({ useLastSearchString = false, pagination } = {}, { getState }) => {
    const state = getState();
    const { input, lastSearchString } = state.workspace.panels[panelIds.SEARCH];
    const searchString = useLastSearchString ? lastSearchString : input;
    if (searchString === null || searchKeywords === '') return;
    const extraQueryParams = [`qry_string=${searchString}`];

    return {
      data: await getPanelElements(state, "query", extraQueryParams, pagination),
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
export const elementsInitialState = {
  elements: null,
  hitCount: null,
  page: 1,
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
      hackyToggle: false,
      highlight: false,
    },
    focusedSidebarElement: {
      index: null,
    },
    [panelIds.MAIN_PANEL]: {
      ...elementsInitialState,
    },
    [panelIds.SEARCH]: {
      ...elementsInitialState,
      input: null,
      lastSearchString: null,
      hitCountWithDuplicates: null,
    },
    [panelIds.LABEL_NEXT]: {
      ...elementsInitialState,
    },
    [panelIds.POSITIVE_PREDICTIONS]: {
      ...elementsInitialState,
      refetch: false,
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

  // action reducers for focusing main panel elements
  setFocusedMainPanelElement(state, action) {
    const { element, highlight } = action.payload;
    state.panels.focusedElement = getUpdatedFocusedElementState(
      element,
      state.panels.focusedElement.hackyToggle,
      highlight,
      initialState.panels.focusedElement
    );
  },
  clearMainPanelFocusedElement(state, action) {
    state.panels.focusedElement = initialState.panels.focusedElement;
  },
  focusFirstElement(state, action) {
    const highlight = false;
    const elements = state.panels[panelIds.MAIN_PANEL].elements;
    const element = elements ? Object.values(elements)[0] : null;
    if (element) {
      state.panels.focusedElement = getUpdatedFocusedElementState(
        element,
        state.panels.focusedElement.hackyToggle,
        highlight,
        initialState.panels.focusedElement
      );
    }
  },

  // action reducers for focusing sidebar panel elements
  setfocusedSidebarElementByIndex(state, action) {
    const index = action.payload;
    state.panels.focusedSidebarElement.index = index;
  },
  focusFirstSidebarElement(state, action) {
    const currentSidebarElements = getCurrentSidebarElements(state);
    if (currentSidebarElements === null || currentSidebarElements.length === 0) return;
    state.panels.focusedSidebarElement.index = 0;
  },
  focusLastSidebarElement(state, action) {
    const currentSidebarElements = getCurrentSidebarElements(state);
    if (currentSidebarElements === null || currentSidebarElements.length === 0) return;
    state.panels.focusedSidebarElement.index = currentSidebarElements.length - 1;
  },
  focusNextSidebarElement(state, action) {
    const currentSidebarElements = getCurrentSidebarElements(state);
    // abort if there are no elements
    if (currentSidebarElements === null ||  currentSidebarElements.length === 0) return;
    const currentFocusedSidebarElementIndex = state.panels.focusedSidebarElement.index;
    // abort if there are is no next element in the current page
    if (currentFocusedSidebarElementIndex === currentSidebarElements.length - 1) return;

    state.panels.focusedSidebarElement.index += 1;
  },
  focusPreviousSidebarElement(state, action) {
    const currentSidebarElements = getCurrentSidebarElements(state);
    // abort if there are no elements
    if (currentSidebarElements === null || currentSidebarElements.length === 0) return;
    const currentFocusedSidebarElementIndex = state.panels.focusedSidebarElement.index;
    // abort if there are is no next element in the current page
    if (currentFocusedSidebarElementIndex === 0) return;

    state.panels.focusedSidebarElement.index -= 1;
  },

  changeCurrentDocument(state, action) {
    // mainPanelElementsPerPage has to be passed in as a parameter
    // because the only part of the redux state is the workspace slice
    // mainPanelElementsPerPage is needed to calculate the main panel page
    const {newDocId, mainPanelElementsPerPage} = action.payload;
    const curDocIndex = state.documents.findIndex((d) => d.document_id === newDocId);
    state.curDocName = newDocId;
    state.curDocId = curDocIndex;

    // set the page of the new document based on the focused main panel element, if any
    // IMPORTANT: when changing the document, the focused element has to be set first,
    // so that both, the document and the page are set atomically. Setting those separately
    // will cause elements to be fetched twice, once when document changes and once when 
    // page changes
    let page;
    if (state.panels.focusedElement.id !== null) {
      const mainElementIndex = getElementIndex(state.panels.focusedElement.id);
      page = Math.floor(mainElementIndex / mainPanelElementsPerPage) + 1;
    }
    else {
      page = 1;
    }
    state.panels[panelIds.MAIN_PANEL].page = page; 
  },
  setPage(state, action) {
    const { panelId, newPage } = action.payload;
    state.panels[panelId].page = newPage;
  },
  setRefetch(state, action) {
    state.panels.refetch = action.payload;
  },
};

const getUpdatedFocusedElementState = (
  element,
  hackyToggle,
  highlight,
  defaultState,
  panelId = panelIds.MAIN_PANEL
) => {
  if (element) {
    const { id: elementId, docId } = element;
    return {
      id: elementId,
      docId,
      DOMKey: elementId ? getPanelDOMKey(elementId, panelId) : null,
      hackyToggle: !hackyToggle,
      highlight,
    };
  } else {
    return {
      ...defaultState,
      hackyToggle: hackyToggle,
    };
  }
};

export const extraReducers = {
  // Positive predictions panel extra reducers
  [getPositivePredictions.pending]: (state, action) => {
    state.panels.loading[panelIds.POSITIVE_PREDICTIONS] = true;
  },
  [getPositivePredictions.fulfilled]: (state, action) => {
    const { elements: unparsedElements, total_count: hitCount } = action.payload;
    const { elements } = parseElements(unparsedElements, state.curCategory);
    state.panels.loading[panelIds.POSITIVE_PREDICTIONS] = false;
    state.panels[panelIds.POSITIVE_PREDICTIONS].elements = elements;
    state.panels[panelIds.POSITIVE_PREDICTIONS].hitCount = hitCount;
  },

  // Positive labels panel extra reducers
  [getAllPositiveLabels.pending]: (state, action) => {
    state.panels.loading[panelIds.POSITIVE_LABELS] = true;
  },
  [getAllPositiveLabels.fulfilled]: (state, action) => {
    const { elements: unparsedElements, hit_count: hitCount } = action.payload;
    const { elements } = parseElements(unparsedElements, state.curCategory);
    state.panels.loading[panelIds.POSITIVE_LABELS] = false;
    state.panels[panelIds.POSITIVE_LABELS].elements = elements;
    state.panels[panelIds.POSITIVE_LABELS].hitCount = hitCount;
  },

  // Positive predictions panel extra reducers
  [getSuspiciousLabels.pending]: (state, action) => {
    state.panels.loading[panelIds.SUSPICIOUS_LABELS] = true;
  },
  [getSuspiciousLabels.fulfilled]: (state, action) => {
    const { elements: unparsedElements, hit_count: hitCount } = action.payload;
    const { elements } = parseElements(unparsedElements, state.curCategory);
    state.panels.loading[panelIds.SUSPICIOUS_LABELS] = false;
    state.panels[panelIds.SUSPICIOUS_LABELS].elements = elements;
    state.panels[panelIds.SUSPICIOUS_LABELS].hitCount = hitCount;
  },

  // Contradicting labels panel extra reducers
  [getContradictingLabels.pending]: (state, action) => {
    state.panels.loading[panelIds.CONTRADICTING_LABELS] = true;
  },
  [getContradictingLabels.rejected]: (state, action) => {
    state.panels.loading[panelIds.CONTRADICTING_LABELS] = false;
  },
  [getContradictingLabels.fulfilled]: (state, action) => {
    const { pairs, hit_count: hitCount } = action.payload;

    const flattedPairs = pairs?.length ? pairs.flat() : [];

    const { elements } = parseElements(flattedPairs, state.curCategory);

    state.panels.loading[panelIds.CONTRADICTING_LABELS] = false;
    state.panels[panelIds.CONTRADICTING_LABELS] = {
      ...state.panels[panelIds.CONTRADICTING_LABELS],
      elements,
      pairs: pairs.map((pair) => pair.map((element) => element.id)),
    };
    state.panels[panelIds.CONTRADICTING_LABELS].hitCount = hitCount;
  },

  // Label next panel extra reducers
  [getElementToLabel.pending]: (state, action) => {
    state.panels.loading[panelIds.LABEL_NEXT] = true;
  },
  [getElementToLabel.fulfilled]: (state, action) => {
    const { elements: unparsedElements, hit_count: hitCount } = action.payload;
    const { elements } = parseElements(unparsedElements, state.curCategory);

    state.panels.loading[panelIds.LABEL_NEXT] = false;
    state.panels[panelIds.LABEL_NEXT].elements = {...elements};
    state.panels[panelIds.LABEL_NEXT].hitCount = hitCount;
  },

  // Search panel extra reducers
  [searchKeywords.pending]: (state, _) => {
    state.panels.loading[panelIds.SEARCH] = true;
    // state.panels[panelIds.SEARCH].elements = null;
    // state.panels[panelIds.SEARCH] = {
    //   ...initialState.panels[panelIds.SEARCH],
    //   input: state.panels[panelIds.SEARCH].input,
    //   hitCount: state.panels[panelIds.SEARCH].hitCount,
    // };
  },
  [searchKeywords.fulfilled]: (state, action) => {
    const { data, searchString } = action.payload;
    const { elements: unparsedElements, hit_count_unique: hitCount, hit_count: hitCountWithDuplicates } = data;

    const { elements } = parseElements(unparsedElements, state.curCategory);

    state.panels.loading[panelIds.SEARCH] = false;
    state.panels[panelIds.SEARCH] = {
      ...state.panels[panelIds.SEARCH],
      elements,
      hitCountWithDuplicates,
      hitCount,
      lastSearchString: searchString,
    };
  },

  // Main panel extra reducers
  /**
   * Updates the states when a new document has been fetched
   * @param {the document elements} elements
   * @param {the whole state, only curCategory and labelCount } state
   * @param {the document id, i.g. 4} newDocId
   * @param {the actual document id: i.g. medium-Andean condor} newDocName
   * @returns {the state that has to be updated}
   */
  [fetchDocumentElements.pending]: (state, action) => {
    state.panels.loading[panelIds.MAIN_PANEL] = true;
  },
  [fetchDocumentElements.fulfilled]: (state, action) => {
    const { elements: unparsedElements, hit_count: hitCount } = action.payload;

    const { elements, documentPos, documentNeg } = parseElements(unparsedElements, state.curCategory);

    state.panels[panelIds.MAIN_PANEL] = {
      ...state.panels[panelIds.MAIN_PANEL],
      elements,
      hitCount,
    };
    state.panels.loading[panelIds.MAIN_PANEL] = false;
    state.labelCount = {
      ...state.labelCount,
      documentPos,
      documentNeg,
    };

  // set page to 1 if focused element is not in current page

  },
};

/**
 * Selector for getting the element object that is focused on the sidebar panel
 * This information is not stored on the redux state because only the index
 * of the element is needed to identify it
 * @param {*} state 
 * @returns the focused element with its id, text and docId
 */
export const focusedSidebarElementSelector = (state) => {
  const activePanelId = state.workspace.panels.activePanelId;
  const activePanel = state.workspace.panels[activePanelId];
  const focusedSidebarElementIndex = state.workspace.panels.focusedSidebarElement.index;

  if (activePanelId === null || activePanelId === "") return null;
  let elementsDict = activePanel.elements;
  if (elementsDict === null || focusedSidebarElementIndex === null) return null;

  let elementKeysList;
  if (activePanelId === panelIds.CONTRADICTING_LABELS) {
    elementKeysList = activePanel.pairs.flat();
  } else {
    elementKeysList = Object.keys(elementsDict);
  }

  if (elementKeysList.length === 0) return null;
  const elementId = elementKeysList[focusedSidebarElementIndex];
  const element = elementsDict[elementId];
  if (!element) return elementKeysList[0];
  return element;
};

/**
 * Returns the current sidebar elements list.
 * If the active panel is the Contradicting labels panel
 * the list returned is a flatten list from the list of 
 * contradicting pairs
 */
const getCurrentSidebarElements = (state) => {
  const activePanelId = state.panels.activePanelId;
  if (state.panels.activePanelId === panelIds.CONTRADICTING_LABELS) {
    return state.panels[activePanelId].pairs.flat();
  } else {
    const elementsDict = state.panels[activePanelId].elements
    if (elementsDict === null) return null;
    return Object.values(elementsDict);
  }
}