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

import { useEffect, useMemo, useState } from "react";
import { getPanelDOMKey, scrollIntoElementView } from "../utils/utils";
import { PanelIdsEnum } from "../const";
import { usePrevious } from "./usePrevious";
import { useAppDispatch, useAppSelector } from "./useRedux";

/**
 * This custom hook manage the behaviour of
 * scrolling into an element in the main panel
 * when one has been clicked in a sidebar panel
 * If the useEffect hook is triggered and there
 * is no main panel focused element, scroll into
 * view the first element instead
 */
export const useScrollMainPanelElementIntoView = () => {
  const dispatch = useAppDispatch();
  const { DOMKey: focusedElementDOMKey, hackyToggle } = useAppSelector(
    (state) => state.workspace.panels.focusedElement
  );

  /**
   * The following variables are used to only trigger the effect that
   * is in charge of scrolling main elements into view when required, and that is
   * when focused element changes or when the document changes.
   *
   * elements is an object with key as elementid and the information of that element as its value
   * elementKeys is an array with the keys of `elements`
   * previousElementKeys is the value of the past `elementKeys` in case they changed
   * elementKeysState changes only when a deep comparisson (arrayEquals) between `previousElementKeys` and `previousElementKeys` gives false
   */

  const { elements } = useAppSelector((state) => state.workspace.panels.panels[PanelIdsEnum.MAIN_PANEL]);
  const elementKeys = useMemo(() => (elements ? Object.keys(elements) : null), [elements]);
  const firstElementId = useMemo(
    () => (elementKeys !== null && elementKeys.length > 0 ? elementKeys[0] : null),
    [elementKeys]
  );
  const previousElementKeys = usePrevious(elementKeys);
  const [elementKeysState, setElementKeysState] = useState(elementKeys);

  const arrayEquals = (a: any, b: any) => {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((val, index) => val === b[index]);
  };

  useEffect(() => {
    if (!arrayEquals(previousElementKeys, elementKeys)) {
      setElementKeysState(elementKeys);
    }
  }, [previousElementKeys, elementKeys]);

  useEffect(() => {
    let element;
    if (focusedElementDOMKey !== null) {
      element = document.getElementById(focusedElementDOMKey);
      scrollIntoElementView(element);
    } else if (firstElementId) {
      // if there is no focused element, scroll into the first element of the list instead
      const firstElementDOMKey = getPanelDOMKey(firstElementId, PanelIdsEnum.MAIN_PANEL);
      element = document.getElementById(firstElementDOMKey);
      scrollIntoElementView(element, false);
    }
  }, [firstElementId, focusedElementDOMKey, hackyToggle, elementKeysState, dispatch]);
};
