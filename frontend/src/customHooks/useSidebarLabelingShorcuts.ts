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

import React, { useCallback, useMemo, useEffect, useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "./useRedux";
import { useEventListener } from "usehooks-ts";
import {
  focusNextSidebarElement,
  focusPreviousSidebarElement,
  focusFirstSidebarElement,
  focusLastSidebarElement,
} from "../modules/Workplace/redux";
import { focusedSidebarElementSelector } from "../modules/Workplace/redux/panelsSlice";
import { KeyboardKeysEnum, focusNextOnLabelingPanels, panelIds } from "../const";

import { usePrevious } from "./usePrevious";
import usePanelPagination from "./usePanelPagination";
import useLabelState from "./useLabelState";
import { useFocusMainPanelElement } from "./useFocusMainPanelElement";

interface UseSidebarLabelingShortcuts {
  setShortcutsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Custom hook for adding shortcuts to the
 * right sidebar panels. It does so by adding
 * event listeners to the corresponding key down events
 */
export const useSidebarLabelingShortcuts = ({ setShortcutsModalOpen }: UseSidebarLabelingShortcuts) => {
  const [focusLastElementOnPageChange, setFocusLastElementOnPageChange] = useState(false);

  const dispatch = useAppDispatch();

  const activePanelId = useAppSelector((state) => state.workspace.panels.activePanelId);
  const curCategory = useAppSelector((state) => state.workspace.curCategory);
  const sidebarPanelElementsPerPage = useAppSelector((state) => state.featureFlags.sidebarPanelElementsPerPage);
  const focusedSidebarElementIndex = useAppSelector((state) => state.workspace.panels.focusedSidebarElement.index);
  const focusedElement = useAppSelector(focusedSidebarElementSelector);
  const loading = useAppSelector((state) => state.workspace.panels.loading[activePanelId]);

  const pressedKeys = useRef<{ [key: string]: boolean }>({});

  // useLabelState needs to know whether to update the counter on labeling,
  // which is false only in the evalaution panel
  const { handlePosLabelState, handleNegLabelState } = useLabelState(activePanelId !== panelIds.EVALUATION);

  // use pagination for the active panel without fetching anything
  const { goToPreviousPage, goToNextPage, currentContentData, currentPage, pageCount } = usePanelPagination({
    elementsPerPage: sidebarPanelElementsPerPage,
    panelId: activePanelId,
    shouldFetch: false,
  });

  const focusNextElementOnLabeling = useMemo(() => focusNextOnLabelingPanels.includes(activePanelId), [activePanelId]);

  const isFirstElementFocused = useMemo(
    () => currentContentData !== null && currentContentData.length && focusedSidebarElementIndex === 0,
    [focusedSidebarElementIndex, currentContentData]
  );

  const isLastElementFocused = useMemo(
    () =>
      currentContentData !== null &&
      currentContentData.length &&
      focusedSidebarElementIndex === currentContentData.length - 1,
    [focusedSidebarElementIndex, currentContentData]
  );

  const previousLoading = usePrevious(loading);

  // elementsFetched is true only when the loading state changes from true to false
  const elementsFetched = useMemo(() => previousLoading && !loading, [previousLoading, loading]);

  useEffect(() => {
    if (elementsFetched) {
      if (focusLastElementOnPageChange) {
        dispatch(focusLastSidebarElement());
        setFocusLastElementOnPageChange(false);
      } else {
        dispatch(focusFirstSidebarElement());
      }
    }
  }, [elementsFetched, focusLastElementOnPageChange, dispatch]);

  const focusNextElement = useCallback(() => {
    if (isLastElementFocused) {
      if (currentPage === pageCount) return;
      goToNextPage();
      setFocusLastElementOnPageChange(false);
    } else {
      dispatch(focusNextSidebarElement());
    }
  }, [isLastElementFocused, currentPage, pageCount, goToNextPage, setFocusLastElementOnPageChange, dispatch]);

  const focusPreviousElement = useCallback(() => {
    if (isFirstElementFocused) {
      if (currentPage === 1) return;
      goToPreviousPage();
      setFocusLastElementOnPageChange(true);
    } else {
      dispatch(focusPreviousSidebarElement());
    }
  }, [isFirstElementFocused, currentPage, goToPreviousPage, setFocusLastElementOnPageChange, dispatch]);

  const { focusMainPanelElement } = useFocusMainPanelElement();

  const onKeyDown = (event: KeyboardEvent) => {
    pressedKeys.current[event.key] = true;
  };

  const onKeyUp = (event: KeyboardEvent) => {
    pressedKeys.current[event.key] = false;
  };

  const onKeyDownShurtcuts = (event: KeyboardEvent) => {
    // prevent default behaviour for arrow events
    // letters shouldn't be prevented so user can type
    // and use native shorcut like refreshing the page
    if (event.key.startsWith("Arrow")) {
      event.preventDefault();
    }

    if (event.key === KeyboardKeysEnum.ARROW_DOWN) {
      focusNextElement();
    }
    if (event.key === KeyboardKeysEnum.ARROW_UP) {
      focusPreviousElement();
    }

    if (focusedElement) {
      if (curCategory !== null) {
        if (event.key === KeyboardKeysEnum.ARROW_LEFT) {
          handleNegLabelState(focusedElement);
          if (focusNextElementOnLabeling) {
            focusNextElement();
          }
        }
        if (event.key === KeyboardKeysEnum.ARROW_RIGHT) {
          handlePosLabelState(focusedElement);
          if (focusNextElementOnLabeling) {
            focusNextElement();
          }
        }
      }
      if (event.key === KeyboardKeysEnum.ENTER) {
        focusMainPanelElement({ element: focusedElement, docId: focusedElement.docId });
      }
    }
    if (
      pressedKeys.current[KeyboardKeysEnum.SHIFT] === true &&
      pressedKeys.current[KeyboardKeysEnum.QUESTION_MARK] === true
    ) {
      setShortcutsModalOpen(true);
    }
  };

  useEventListener("keydown", onKeyDown);
  useEventListener("keyup", onKeyUp);
  useEventListener("keydown", onKeyDownShurtcuts);
};
