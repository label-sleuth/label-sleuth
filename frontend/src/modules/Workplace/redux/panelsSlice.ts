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
import {
  getCategoryQueryString,
  getQueryParamsString,
  parseElements,
  getPanelDOMKey,
  getElementIndex,
  getWorkspaceId,
  getModeQueryParam,
} from "../../../utils/utils";
import { client } from "../../../api/client";

import { RootState } from "../../../store/configureStore";
import {
  ContractingLabelsPanelState,
  Element,
  ElementsDict,
  FetchPanelElementsParams,
  FocusedElement,
  PaginationParam,
  PanelsSliceState,
  PanelState,
  ReducerObj,
  UnparsedElement,
  WorkspaceState,
} from "../../../global";
import { PanelIdsEnum, WorkspaceMode } from "../../../const";
import { currentDocNameSelector } from "./documentSlice";
//import { current } from "@reduxjs/toolkit";

/**
 * Initial state for the elements object of each panel.
 * The elements object contains key-value pair where each
 * key is an element's id and the value is the information
 * of the specific element (text, id, docId, userLabel and
 * modelPrediction)
 */
export const elementsInitialState: PanelState = {
  elements: null,
  hitCount: null,
  page: 1,
};

/**
 * Initial state of the loading state of the sidebar panels.
 * The loading object contains a key-value pair for each
 * panel.
 */
const loadingInitialState: { [key: string]: boolean } = {};
Object.values(PanelIdsEnum).forEach(
  (pId) => (loadingInitialState[pId] = false)
);

/**
 * The initial state for each of the panels. The key for each panel
 * is the id stored in panelsIds. In addition, it stores two
 * extra fields: the loading field and the activePanelId which holds
 * which is the current active sidebar panel.
 */
export const initialState: PanelsSliceState = {
  panels: {
    loading: loadingInitialState,
    activePanelId: PanelIdsEnum.NOT_SET,
    focusedElement: {
      id: null,
      DOMKey: null,
      hackyToggle: false,
      highlight: false,
    },
    focusedSidebarElement: {
      index: null,
      scrollIntoViewOnChange: true,
    },
    panels: {
      [PanelIdsEnum.MAIN_PANEL]: {
        ...elementsInitialState,
        documentPositivePredictionIds: null,
      },
      [PanelIdsEnum.SEARCH]: {
        ...elementsInitialState,
        input: null,
        lastSearchString: null,
        hitCountWithDuplicates: null,
      },
      [PanelIdsEnum.LABEL_NEXT]: {
        ...elementsInitialState,
      },
      [PanelIdsEnum.POSITIVE_PREDICTIONS]: {
        ...elementsInitialState,
      },
      [PanelIdsEnum.POSITIVE_LABELS]: {
        ...elementsInitialState,
      },
      [PanelIdsEnum.SUSPICIOUS_LABELS]: {
        ...elementsInitialState,
      },
      [PanelIdsEnum.CONTRADICTING_LABELS]: {
        ...elementsInitialState,
        pairs: [],
      },
      [PanelIdsEnum.EVALUATION]: {
        initialElements: {},
        ...elementsInitialState,
        isInProgress: false,
        lastScore: null,
        scoreModelVersion: null,
      },
    },
  },
};

/**
 * This file contains the Thunks, reducers, extraReducers and state to
 * manage the panels. The panels are the main panel and the sidebar panels
 */
const getWorkspace_url = `${BASE_URL}/${WORKSPACE_API}`;

const getPanelElements = async (
  state: RootState,
  endpoint: string,
  extraQueryParams: Array<string> = [],
  pagination: PaginationParam = { startIndex: 0, elementsPerPage: null }
): Promise<{ elements: UnparsedElement[]; hit_count: number }> => {
  pagination.startIndex !== null &&
    extraQueryParams.push(`start_idx=${pagination.startIndex}`);
  pagination.elementsPerPage !== null &&
    extraQueryParams.push(`size=${pagination.elementsPerPage}`);
  // add mode to the query params
  extraQueryParams.push(getModeQueryParam(state.workspace.mode));
  let queryParamsList: string[] = [];
  // only send categoryId in binary mode
  state.workspace.mode === WorkspaceMode.BINARY &&
    queryParamsList.push(getCategoryQueryString(state.workspace.curCategory));

  queryParamsList = [...queryParamsList, ...extraQueryParams];
  const queryParams = getQueryParamsString(queryParamsList);

  const url = `${getWorkspace_url}/${encodeURIComponent(
    getWorkspaceId()
  )}/${endpoint}${queryParams}`;

  const { data } = await client.get(url);
  return data;
};

export const getElementToLabel = createAsyncThunk<
  ReturnType<typeof getPanelElements>,
  FetchPanelElementsParams,
  { state: RootState }
>("workspace/getElementToLabel", async ({ pagination }, { getState }) => {
  const state = getState();
  return await getPanelElements(state, "active_learning", [], pagination);
});

export const getUserLabels = createAsyncThunk<
  ReturnType<typeof getPanelElements>,
  FetchPanelElementsParams,
  { state: RootState }
>(
  "workspace/getPositiveElements",
  async ({ pagination, value }, { getState }) => {
    const state = getState();
    return await getPanelElements(
      state,
      "positive_elements",
      value ? [`value=${value}`] : [],
      pagination
    );
  }
);

export const getSuspiciousLabels = createAsyncThunk<
  ReturnType<typeof getPanelElements>,
  FetchPanelElementsParams,
  { state: RootState }
>("workspace/getSuspiciousElements", async ({ pagination }, { getState }) => {
  const state = getState();
  return await getPanelElements(state, "suspicious_elements", [], pagination);
});

export const getContradictingLabels = createAsyncThunk<
  ReturnType<typeof getPanelElements>,
  FetchPanelElementsParams,
  { state: RootState }
>(
  "workspace/getContradictiveElements",
  async ({ pagination }, { getState }) => {
    const state = getState();
    return await getPanelElements(
      state,
      "contradiction_elements",
      [],
      pagination
    );
  }
);

export const getPositivePredictions = createAsyncThunk<
  ReturnType<typeof getPanelElements>,
  FetchPanelElementsParams,
  { state: RootState }
>(
  "workspace/getPositivePredictions",
  async ({ pagination, value }, { getState }) => {
    const state = getState();
    return await getPanelElements(
      state,
      "positive_predictions",
      value ? [`value=${value}`] : [],
      pagination
    );
  }
);

export const fetchDocumentElements = createAsyncThunk<
  ReturnType<typeof getPanelElements>,
  FetchPanelElementsParams,
  {
    state: RootState;
  }
>("workspace/fetchDocumentElements", async (params, { getState }) => {
  const state = getState();
  let docId = params.docId || currentDocNameSelector(state) || "";

  return await getPanelElements(
    state,
    `document/${encodeURIComponent(docId)}`,
    [],
    params.pagination
  );
});

export const fetchDocumentPositivePredictions = createAsyncThunk<
  ReturnType<typeof getPanelElements>,
  FetchPanelElementsParams,
  {
    state: RootState;
  }
>(
  "workspace/fetchDocumentPositivePredictions",
  async (params, { getState }) => {
    const state = getState();
    let docId = params.docId || currentDocNameSelector(state) || "";

    return await getPanelElements(
      state,
      `document/${encodeURIComponent(docId)}/positive_predictions`,
      [],
      params.pagination
    );
  }
);

export const searchKeywords = createAsyncThunk<
  any, //TODO: find out how to correctly type the return type of this thunk
  FetchPanelElementsParams,
  {
    state: RootState;
  }
>(
  "workspace/searchKeywords",
  async ({ useLastSearchString = false, pagination } = {}, { getState }) => {
    const state = getState();
    const { input, lastSearchString } =
      state.workspace.panels.panels[PanelIdsEnum.SEARCH];
    const searchString = useLastSearchString ? lastSearchString : input;
    if (searchString === null || searchString === "") return;
    const extraQueryParams = [`qry_string=${searchString}`];
    const res = {
      data: await getPanelElements(
        state,
        "query",
        extraQueryParams,
        pagination
      ),
      searchString,
    };
    return res;
  }
);

export const reducers = {
  setActivePanel(state: WorkspaceState, action: PayloadAction<PanelIdsEnum>) {
    state.panels.activePanelId = action.payload;
  },
  resetSearchResults(state: WorkspaceState, action: PayloadAction<void>) {
    state.panels.panels[PanelIdsEnum.SEARCH].elements = null;
  },
  setSearchInput(state: WorkspaceState, action: PayloadAction<string>) {
    state.panels.panels[PanelIdsEnum.SEARCH].input = action.payload;
  },
  resetLastSearchString(state: WorkspaceState, action: PayloadAction<void>) {
    state.panels.panels[PanelIdsEnum.SEARCH].lastSearchString = null;
  },

  // action reducers for focusing main panel elements
  setFocusedMainPanelElement(
    state: WorkspaceState,
    action: PayloadAction<{ element: Element; highlight: boolean }>
  ) {
    const { element, highlight } = action.payload;
    state.panels.focusedElement = getUpdatedFocusedElementState(
      element,
      state.panels.focusedElement.hackyToggle,
      highlight,
      initialState.panels.focusedElement
    );
  },
  clearMainPanelFocusedElement(
    state: WorkspaceState,
    action: PayloadAction<void>
  ) {
    state.panels.focusedElement = initialState.panels.focusedElement;
  },
  focusFirstElement(state: WorkspaceState, action: PayloadAction<void>) {
    const highlight = false;
    const elements = state.panels.panels[PanelIdsEnum.MAIN_PANEL].elements;
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
  setfocusedSidebarElementByIndex(
    state: WorkspaceState,
    action: PayloadAction<{ index: number; scrollIntoViewOnChange: boolean }>
  ) {
    const { index, scrollIntoViewOnChange } = action.payload;
    state.panels.focusedSidebarElement.index = index;
    state.panels.focusedSidebarElement.scrollIntoViewOnChange =
      scrollIntoViewOnChange;
  },
  focusFirstSidebarElement(state: WorkspaceState, action: PayloadAction<void>) {
    const currentSidebarElements = getCurrentSidebarElements(state);
    if (currentSidebarElements === null || currentSidebarElements.length === 0)
      return;
    state.panels.focusedSidebarElement.index = 0;
    state.panels.focusedSidebarElement.scrollIntoViewOnChange = true;
  },
  focusLastSidebarElement(state: WorkspaceState, action: PayloadAction<void>) {
    const currentSidebarElements = getCurrentSidebarElements(state);
    if (currentSidebarElements === null || currentSidebarElements.length === 0)
      return;
    state.panels.focusedSidebarElement.index =
      currentSidebarElements.length - 1;
    state.panels.focusedSidebarElement.scrollIntoViewOnChange = true;
  },
  focusNextSidebarElement(state: WorkspaceState, action: PayloadAction<void>) {
    const currentSidebarElements = getCurrentSidebarElements(state);
    // abort if there are no elements
    if (currentSidebarElements === null || currentSidebarElements.length === 0)
      return;
    const currentFocusedSidebarElementIndex =
      state.panels.focusedSidebarElement.index;
    // abort if there are is no next element in the current page
    if (currentFocusedSidebarElementIndex === currentSidebarElements.length - 1)
      return;

    if (state.panels.focusedSidebarElement.index !== null) {
      state.panels.focusedSidebarElement.scrollIntoViewOnChange = true;
      state.panels.focusedSidebarElement.index += 1;
    }
  },
  focusPreviousSidebarElement(
    state: WorkspaceState,
    action: PayloadAction<void>
  ) {
    const currentSidebarElements = getCurrentSidebarElements(state);
    // abort if there are no elements
    if (currentSidebarElements === null || currentSidebarElements.length === 0)
      return;
    const currentFocusedSidebarElementIndex =
      state.panels.focusedSidebarElement.index;
    // abort if there are is no next element in the current page
    if (currentFocusedSidebarElementIndex === 0) return;

    if (state.panels.focusedSidebarElement.index) {
      state.panels.focusedSidebarElement.scrollIntoViewOnChange = true;
      state.panels.focusedSidebarElement.index -= 1;
    }
  },

  changeCurrentDocument(
    state: WorkspaceState,
    action: PayloadAction<{
      newDocId: string;
      mainPanelElementsPerPage: number;
    }>
  ) {
    // mainPanelElementsPerPage has to be passed in as a parameter
    // because the only part of the redux state is the workspace slice
    // mainPanelElementsPerPage is needed to calculate the main panel page
    const { newDocId, mainPanelElementsPerPage } = action.payload;
    const curDocIndex = state.documents.findIndex(
      (d) => d.documentId === newDocId
    );
    state.curDocIndex = curDocIndex;

    // set the page of the new document based on the focused main panel element, if any
    // IMPORTANT: when changing the document, the focused element has to be set first,
    // so that both, the document and the page are set atomically. Setting those separately
    // will cause elements to be fetched twice, once when document changes and once when
    // page changes
    let page;
    if (state.panels.focusedElement.id !== null) {
      const mainElementIndex = getElementIndex(state.panels.focusedElement.id);
      page = Math.floor(mainElementIndex / mainPanelElementsPerPage) + 1;
    } else {
      page = 1;
    }
    state.panels.panels[PanelIdsEnum.MAIN_PANEL].page = page;
  },
  setPage(
    state: WorkspaceState,
    action: PayloadAction<{ panelId: PanelIdsEnum; newPage: number }>
  ) {
    const { panelId, newPage } = action.payload;
    if (panelId !== PanelIdsEnum.NOT_SET) {
      state.panels.panels[panelId].page = newPage;
    }
  },
};

const getUpdatedFocusedElementState = (
  element: Element | null,
  hackyToggle: boolean,
  highlight: boolean,
  defaultState: FocusedElement,
  panelId = PanelIdsEnum.MAIN_PANEL,
  lastInPage = false
) => {
  if (element !== null) {
    const { id: elementId, docId } = element;
    return {
      id: elementId,
      docId,
      DOMKey: elementId ? getPanelDOMKey(elementId, panelId) : null,
      hackyToggle: !hackyToggle,
      highlight,
      lastInPage,
    };
  } else {
    return {
      ...defaultState,
      hackyToggle: hackyToggle,
      lastInPage,
    };
  }
};

export const extraReducers: Array<ReducerObj> = [
  // Positive predictions panel extra reducers
  {
    action: getPositivePredictions.pending,
    reducer: (state: WorkspaceState, action) => {
      state.panels.loading[PanelIdsEnum.POSITIVE_PREDICTIONS] = true;
    },
  },
  {
    action: getPositivePredictions.fulfilled,
    reducer: (state: WorkspaceState, action) => {
      const { elements: unparsedElements, total_count: hitCount } =
        action.payload;
      const { elements } = parseElements(
        unparsedElements,
        state.curCategory,
        state.mode
      );
      state.panels.loading[PanelIdsEnum.POSITIVE_PREDICTIONS] = false;
      state.panels.panels[PanelIdsEnum.POSITIVE_PREDICTIONS].elements =
        elements;
      state.panels.panels[PanelIdsEnum.POSITIVE_PREDICTIONS].hitCount =
        hitCount;
    },
  },
  {
    action: getUserLabels.pending,
    reducer: (state: WorkspaceState, action) => {
      state.panels.loading[PanelIdsEnum.POSITIVE_LABELS] = true;
    },
  },
  {
    action: getUserLabels.fulfilled,
    reducer: (state: WorkspaceState, action) => {
      const { elements: unparsedElements, hit_count: hitCount } =
        action.payload;
      const { elements } = parseElements(
        unparsedElements,
        state.curCategory,
        state.mode
      );
      state.panels.loading[PanelIdsEnum.POSITIVE_LABELS] = false;
      state.panels.panels[PanelIdsEnum.POSITIVE_LABELS].elements = elements;
      state.panels.panels[PanelIdsEnum.POSITIVE_LABELS].hitCount = hitCount;
    },
  },
  {
    action: getSuspiciousLabels.pending,
    reducer: (state: WorkspaceState, action) => {
      state.panels.loading[PanelIdsEnum.SUSPICIOUS_LABELS] = true;
    },
  },
  {
    action: getSuspiciousLabels.fulfilled,
    reducer: (state: WorkspaceState, action) => {
      const { elements: unparsedElements, hit_count: hitCount } =
        action.payload;
      const { elements } = parseElements(
        unparsedElements,
        state.curCategory,
        state.mode
      );
      state.panels.loading[PanelIdsEnum.SUSPICIOUS_LABELS] = false;
      state.panels.panels[PanelIdsEnum.SUSPICIOUS_LABELS].elements = elements;
      state.panels.panels[PanelIdsEnum.SUSPICIOUS_LABELS].hitCount = hitCount;
    },
  },
  // Contradicting labels panel extra reducers
  {
    action: getContradictingLabels.pending,
    reducer: (state: WorkspaceState, action) => {
      state.panels.loading[PanelIdsEnum.CONTRADICTING_LABELS] = true;
    },
  },
  {
    action: getContradictingLabels.rejected,
    reducer: (state: WorkspaceState, action) => {
      state.panels.loading[PanelIdsEnum.CONTRADICTING_LABELS] = false;
    },
  },
  {
    action: getContradictingLabels.fulfilled,
    reducer: (
      state: WorkspaceState,
      action: PayloadAction<{
        pairs: [UnparsedElement, UnparsedElement][];
        hit_count: number;
      }>
    ) => {
      const { pairs, hit_count: hitCount } = action.payload;

      const flattedPairs = pairs?.length ? pairs.flat() : [];

      const { elements } = parseElements(
        flattedPairs,
        state.curCategory,
        state.mode
      );

      state.panels.loading[PanelIdsEnum.CONTRADICTING_LABELS] = false;
      state.panels.panels[PanelIdsEnum.CONTRADICTING_LABELS] = {
        ...state.panels.panels[PanelIdsEnum.CONTRADICTING_LABELS],
        elements,
        pairs: pairs.map((pair) => [pair[0].id, pair[1].id]),
      };
      state.panels.panels[PanelIdsEnum.CONTRADICTING_LABELS].hitCount =
        hitCount;
    },
  },
  // Label next panel extra reducers
  {
    action: getElementToLabel.pending,
    reducer: (state: WorkspaceState, action) => {
      state.panels.loading[PanelIdsEnum.LABEL_NEXT] = true;
    },
  },
  {
    action: getElementToLabel.fulfilled,
    reducer: (state: WorkspaceState, action) => {
      const { elements: unparsedElements, hit_count: hitCount } =
        action.payload;
      const { elements } = parseElements(
        unparsedElements,
        state.curCategory,
        state.mode
      );

      state.panels.loading[PanelIdsEnum.LABEL_NEXT] = false;
      state.panels.panels[PanelIdsEnum.LABEL_NEXT].elements = { ...elements };
      state.panels.panels[PanelIdsEnum.LABEL_NEXT].hitCount = hitCount;
    },
  },
  // Search panel extra reducers
  {
    action: searchKeywords.pending,
    reducer: (state: WorkspaceState, _) => {
      state.panels.loading[PanelIdsEnum.SEARCH] = true;
      // state.panels[PanelIdsEnum.SEARCH].elements = null;
      // state.panels[PanelIdsEnum.SEARCH] = {
      //   ...initialState.panels[PanelIdsEnum.SEARCH],
      //   input: state.panels[PanelIdsEnum.SEARCH].input,
      //   hitCount: state.panels[PanelIdsEnum.SEARCH].hitCount,
      // };
    },
  },
  {
    action: searchKeywords.fulfilled,
    reducer: (state: WorkspaceState, action) => {
      const { data, searchString } = action.payload;
      const {
        elements: unparsedElements,
        hit_count_unique: hitCount,
        hit_count: hitCountWithDuplicates,
      } = data;

      const { elements } = parseElements(
        unparsedElements,
        state.curCategory,
        state.mode
      );

      state.panels.loading[PanelIdsEnum.SEARCH] = false;
      state.panels.panels[PanelIdsEnum.SEARCH] = {
        ...state.panels.panels[PanelIdsEnum.SEARCH],
        elements,
        hitCountWithDuplicates,
        hitCount,
        lastSearchString: searchString,
      };
    },
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
  {
    action: fetchDocumentElements.pending,
    reducer: (state: WorkspaceState, action) => {
      state.panels.loading[PanelIdsEnum.MAIN_PANEL] = true;
    },
  },

  {
    action: fetchDocumentElements.fulfilled,
    reducer: (state: WorkspaceState, action) => {
      const { elements: unparsedElements, hit_count: hitCount } =
        action.payload;
      const { elements } = parseElements(
        unparsedElements,
        state.curCategory,
        state.mode
      );
      state.panels.panels[PanelIdsEnum.MAIN_PANEL] = {
        ...state.panels.panels[PanelIdsEnum.MAIN_PANEL],
        elements,
        hitCount,
      };
      state.panels.loading[PanelIdsEnum.MAIN_PANEL] = false;
    },
  },
  {
    action: fetchDocumentPositivePredictions.pending,
    reducer: (state: WorkspaceState, action) => {},
  },

  {
    action: fetchDocumentPositivePredictions.fulfilled,
    reducer: (state: WorkspaceState, action) => {
      const { elements: unparsedElements } = action.payload;
      const { elements } = parseElements(
        unparsedElements,
        state.curCategory,
        state.mode
      );
      state.panels.panels[
        PanelIdsEnum.MAIN_PANEL
      ].documentPositivePredictionIds = Object.keys(elements);
    },
  },
];

/**
 * Selector for getting the element object that is focused on the sidebar panel
 * This information is not stored on the redux state because only the index
 * of the element is needed to identify it
 * @param {*} state
 * @returns the focused element with its id, text and docId
 */
export const focusedSidebarElementSelector = (
  state: RootState
): Element | null => {
  const activePanelId = state.workspace.panels.activePanelId;

  if (activePanelId === PanelIdsEnum.NOT_SET) return null;

  const activePanel = state.workspace.panels.panels[activePanelId];
  let elementsDict = activePanel.elements;
  const focusedSidebarElementIndex =
    state.workspace.panels.focusedSidebarElement.index;

  if (elementsDict === null || focusedSidebarElementIndex === null) return null;

  let elementKeysList;
  if (activePanelId === PanelIdsEnum.CONTRADICTING_LABELS) {
    elementKeysList = (activePanel as ContractingLabelsPanelState).pairs.flat();
  } else {
    elementKeysList = Object.keys(elementsDict);
  }

  if (elementKeysList.length === 0) return null;
  const elementId = elementKeysList[focusedSidebarElementIndex];
  const element = elementsDict[elementId];
  if (!element) return elementsDict[elementKeysList[0]];
  return element;
};

/**
 * Returns the current sidebar elements list.
 * If the active panel is the Contradicting labels panel
 * the list returned is a flatten list from the list of
 * contradicting pairs
 */
const getCurrentSidebarElements = (state: WorkspaceState) => {
  const activePanelId = state.panels.activePanelId;
  if (state.panels.activePanelId === PanelIdsEnum.CONTRADICTING_LABELS) {
    return state.panels.panels[PanelIdsEnum.CONTRADICTING_LABELS].pairs.flat();
  } else {
    let elementsDict: ElementsDict | null = null;
    if (activePanelId !== PanelIdsEnum.NOT_SET) {
      elementsDict = state.panels.panels[activePanelId].elements;
    }
    if (elementsDict === null) return null;
    return Object.values(elementsDict);
  }
};
