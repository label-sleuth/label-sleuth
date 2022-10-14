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

import { useCallback, useMemo, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import useLabelState from "./useLabelState";
import {
  focusNextSidebarElement,
  focusPreviousSidebarElement,
  focusFirstSidebarElement,
  focusLastSidebarElement,
} from "../redux/DataSlice";
import { useEventListener } from "../../../customHooks/useEventListener";
import usePanelPagination from "../../../customHooks/usePanelPagination";
import { panelIds } from "../../../const";
import { usePrevious } from "../../../customHooks/usePrevious";
import { useFocusMainPanelElement } from "../customHooks/useFocusMainPanelElement";
import { focusNextOnLabelingPanels } from "../../../const";
import { focusedSidebarElementSelector } from "../redux/panelsSlice";

/**
 * Custom hook for adding shortcuts to the
 * right sidebar panels. It does so by adding
 * event listeners to the corresponding key down events
 */
export const useSidebarLabelingShortcuts = () => {
  const [focusLastElementOnPageChange, setFocusLastElementOnPageChange] = useState(false);
  const activePanelId = useSelector((state) => state.workspace.panels.activePanelId);
  const dispatch = useDispatch();

  // useLabelState needs to know whether to update the counter on labeling,
  // which is false only in the evalaution panel
  const { handlePosLabelState, handleNegLabelState } = useLabelState(activePanelId !== panelIds.EVALUATION);

  const { index: focusedSidebarElementIndex } = useSelector((state) => state.workspace.panels.focusedSidebarElement);

  const sidebarPanelElementsPerPage = useSelector((state) => state.featureFlags.sidebarPanelElementsPerPage);

  const loading = useSelector((state) => state.workspace.panels.loading[activePanelId]);
  const curCategory = useSelector((state) => state.workspace.curCategory);

  // use pagination for the active panel withoud fetching anything
  const { previousPage, nextPage, currentContentData, currentPage, pageCount } = usePanelPagination({
    elementsPerPage: sidebarPanelElementsPerPage,
    panelId: activePanelId,
    shouldFetch: false,
  });

  const focusedElement = useSelector(focusedSidebarElementSelector);

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
      nextPage();
      setFocusLastElementOnPageChange(false);
    } else {
      dispatch(focusNextSidebarElement());
    }
  }, [isLastElementFocused, currentPage, pageCount, nextPage, setFocusLastElementOnPageChange, dispatch]);

  const focusPreviousElement = useCallback(() => {
    if (isFirstElementFocused) {
      if (currentPage === 1) return;
      previousPage();
      setFocusLastElementOnPageChange(true);
    } else {
      dispatch(focusPreviousSidebarElement());
    }
  }, [isFirstElementFocused, currentPage, previousPage, setFocusLastElementOnPageChange, dispatch]);

  const { focusMainPanelElement } = useFocusMainPanelElement();

  const onKeyDown = useCallback(
    (event) => {
      // prevent default behaviour for arrow events
      // letters shouldn't be prevented so user can type
      // and use native shorcut like refreshing the page
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
      }

      if (event.key === "ArrowDown") {
        focusNextElement();
      }
      if (event.key === "ArrowUp") {
        focusPreviousElement();
      }
      if (focusedElement) {
        if (curCategory !== null) {
          if (event.key === "ArrowLeft") {
           handlePosLabelState(focusedElement);
            if (focusNextElementOnLabeling) {
              focusNextElement();
            }
          }
          if (event.key === "ArrowRight") {
            handleNegLabelState(focusedElement);
            if (focusNextElementOnLabeling) {
              focusNextElement();
            }
          }
        }
        if (event.key === "Enter") {
          focusMainPanelElement({ element: focusedElement, docId: focusedElement.docId });
        }
      }
    },
    [
      focusedElement,
      curCategory,
      focusMainPanelElement,
      focusNextElement,
      focusNextElementOnLabeling,
      focusPreviousElement,
      handleNegLabelState,
      handlePosLabelState,
    ]
  );

  useEventListener("keydown", onKeyDown);
};
