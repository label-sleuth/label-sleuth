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

import { useSelector } from "react-redux";
import { useEffect, useMemo } from "react";
import { getPanelDOMKey, scrollIntoElementView } from "../utils/utils";
import { focusedSidebarElementSelector } from "../modules/Workplace/redux/panelsSlice";

export const useFocusSidebarElement = () => {
  const { index: focusedSidebarElementIndex, scrollIntoViewOnChange } = useSelector(
    (state) => state.workspace.panels.focusedSidebarElement
  );
  const focusedElement = useSelector(focusedSidebarElementSelector);
  const activePanelId = useSelector((state) => state.workspace.panels.activePanelId);
  const focusedElementId = useMemo(() => (focusedElement === null ? null : focusedElement.id), [focusedElement]);

  useEffect(() => {
    if (focusedElementId === null || scrollIntoViewOnChange === false) return;
    const focusedSidebarElementDOMKey = getPanelDOMKey(focusedElementId, activePanelId, focusedSidebarElementIndex);
    const element = document.getElementById(focusedSidebarElementDOMKey);
    scrollIntoElementView(element);
  }, [focusedElementId, scrollIntoViewOnChange, focusedSidebarElementIndex, activePanelId]);
};
