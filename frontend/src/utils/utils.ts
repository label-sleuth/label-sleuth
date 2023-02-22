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

import { LabelActionsEnum, LabelTypesEnum, PanelIdsEnum } from "../const";
import { Element, ElementsDict, PanelsSliceState, UnparsedElement } from "../global";

/**
 * Returns the suffix of a number in its ordinal form
 **/
export const getOrdinalSuffix = (x: number): string => {
  // suffix pattern repeats every 100 numbers
  x %= 100;
  let prefix = "th";
  if (x <= 3 || x >= 21) {
    switch (x % 10) {
      case 1:
        prefix = "st";
        break;
      case 2:
        prefix = "nd";
        break;
      case 3:
        prefix = "rd";
        break;
      default: {
      }
    }
  }
  return prefix;
};
export const getCategoryQueryString = (curCategoryId: number | null): string => {
  return curCategoryId !== null ? `category_id=${curCategoryId}` : "";
};
export const getQueryParamsString = (queryParams: string[]): string => {
  let queryParamsString = "";
  queryParams.forEach((param) => {
    queryParamsString = param ? `${queryParamsString}${param}&` : queryParamsString;
  });
  // add leading '?' removes last '&'
  queryParamsString = "?" + queryParamsString.substring(0, queryParamsString.length - 1);
  // return an empty string if there are no query params
  return queryParamsString === "?" ? "" : queryParamsString;
};

/**
 * Implements the logic of deciding what's the resulting state of an element label based
 * on its current label and the label action
 * @param {The element's current label value. It can be '', 'neg' or 'pos'} currentLabel
 * @param {The label action. It can be: 'neg' or 'pos'} action
 * @returns
 */
export const getNewLabelState = (
  currentLabel: LabelTypesEnum,
  labelAction: LabelActionsEnum
): { documentLabelCountChange: { pos: number; neg: number }; newLabel: LabelTypesEnum } => {
  let documentLabelCountChange;
  let newLabel;

  if (currentLabel === LabelTypesEnum.POS) {
    if (labelAction === LabelActionsEnum.POS) {
      documentLabelCountChange = {
        pos: -1,
        neg: 0,
      };
      newLabel = LabelTypesEnum.NONE;
    } else {
      documentLabelCountChange = {
        pos: -1,
        neg: 1,
      };
      newLabel = LabelTypesEnum.NEG;
    }
  } else if (currentLabel === LabelTypesEnum.NEG) {
    if (labelAction === LabelActionsEnum.POS) {
      documentLabelCountChange = {
        pos: 1,
        neg: -1,
      };
      newLabel = LabelTypesEnum.POS;
    } else {
      documentLabelCountChange = {
        pos: 0,
        neg: -1,
      };
      newLabel = LabelTypesEnum.NONE;
    }
  } else {
    if (labelAction === LabelActionsEnum.POS) {
      documentLabelCountChange = {
        pos: 1,
        neg: 0,
      };
      newLabel = LabelTypesEnum.POS;
    } else {
      documentLabelCountChange = {
        pos: 0,
        neg: 1,
      };
      newLabel = LabelTypesEnum.NEG;
    }
  }
  return {
    documentLabelCountChange,
    newLabel,
  };
};

/**
 * Get's the boolean string of a label value, because currently we are using
 * 'pos' or 'neg' for internal labelling processes and 'true' or 'false' for
 * the the REST API.
 * @param {*} label
 * @returns
 */
export const getBooleanLabel = (label: LabelTypesEnum): string => {
  return label === LabelTypesEnum.POS ? "true" : label === LabelTypesEnum.NEG ? "false" : LabelTypesEnum.NONE;
};

export const getStringLabel = (unparsedLabel: string): LabelTypesEnum => {
  return unparsedLabel === "true"
    ? LabelTypesEnum.POS
    : unparsedLabel === "false"
    ? LabelTypesEnum.NEG
    : LabelTypesEnum.NONE;
};

/**
 * Parses the elements of a document extracting the user labels
 * @param {list of elements of a document} elements
 * @param {The current selected category} curCategory
 * @param {whether to add the id of the element in its entry key} includeId
 * @returns
 */
export const parseElements = (
  unparsedElements: UnparsedElement[],
  curCategoryId: number | null
): { elements: ElementsDict; documentNeg: number; documentPos: number } => {
  
  let elements: ElementsDict = {};
  let documentPos = 0;
  let documentNeg = 0;

  unparsedElements.forEach((element) => {
    const userLabels = element["user_labels"];
    elements[element.id] = parseElement(element, curCategoryId);
    if (curCategoryId !== null && curCategoryId in userLabels) {
      documentPos += userLabels[curCategoryId] === true ? 1 : 0;
      documentNeg += userLabels[curCategoryId] === false ? 1 : 0;
    }
  });
  return {
    elements,
    documentPos,
    documentNeg,
  };
};

export const parseElement = (
  { docid, id, model_predictions, user_labels, text }: UnparsedElement,
  curCategoryId: number | null
): Element => ({
  docId: docid,
  id: id,
  modelPrediction: curCategoryId!==null ? getStringLabel(`${model_predictions[curCategoryId]}`) : LabelTypesEnum.NONE,
  userLabel: curCategoryId!==null ?  getStringLabel(`${user_labels[curCategoryId]}`) : LabelTypesEnum.NONE,
  text,
});

export const getPanelDOMKey = (elementId: string, panelId: PanelIdsEnum, index : number | null = null): string => {
  let res = `${panelId}_${elementId}`;
  if (index !== null) {
    res = `${res}_${index}`;
  }
  return res;
};

export const synchronizeElement = (
  elementId: string,
  userLabel: LabelTypesEnum,
  panelsState: PanelsSliceState
): {
  panelsState: PanelsSliceState;
} => {
  const panels = panelsState.panels.panels;
  let previousLabel: LabelTypesEnum | null = null;
  Object.values(panels).forEach((panel) => {
    const elements = panel.elements;
    if (elements !== null && elementId in elements) {
      // save previous label value
      if (previousLabel === null) {
        previousLabel = elements[elementId].userLabel;
      }
      elements[elementId].userLabel = userLabel;
    }
  });

  return {
    panelsState,
  };
};

export const scrollIntoElementView = (element: HTMLElement | null, smoothly = true): void => {
  element &&
    element.scrollIntoView({
      behavior: smoothly ? "smooth" : "auto",
      block: "center",
    });
};

export const getElementIndex = (elementId: string): number =>
  parseInt(elementId.substring(elementId.lastIndexOf("-") + 1));

/**
 * Get the number of pages based on the elements
 * per page and the total elements count. The count
 * starts from 1. To avoid
 * @param {*} elementsPerPage
 * @param {*} elementsCount
 * @returns
 */
export const getPageCount = (elementsPerPage: number, elementsCount: number | null): number =>
  elementsCount !== null ? Math.ceil(elementsCount / elementsPerPage) : 0;

export const getAddedCategoriesNotificationString = (categories: string[]): string => {
  if (categories.length === 1) return categories[0];
  else {
    let res = "";
    if (categories.length > 2) categories.slice(0, -2).forEach((c) => (res += `${c}, `));
    res += categories.slice(-2, -1)[0] + " and " + categories.slice(-1)[0];
    return res;
  }
};
export const getWorkspaceId = (): string => {
  const sessionStorageWorspaceId = window.sessionStorage.getItem("workspaceId");
  if (sessionStorageWorspaceId !== null) {
    return JSON.parse(sessionStorageWorspaceId);
  } else {
    throw new Error("There is no workspace available in the SessionStorage");
  }
};
