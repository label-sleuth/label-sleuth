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

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import "../components/pagination/pagination.css";
import { setPage } from "../modules/Workplace/redux";
import { useFetchPanelElements } from "./useFetchPanelElements";
import { getPageCount } from "../utils/utils";
import { elementsInitialState } from "../modules/Workplace/redux/panelsSlice";
import { panelIds } from "../const";

const usePanelPagination = ({
  elementsPerPage,
  panelId,
  shouldFetch = true,
  otherDependencies = [],
  fakePagination = false,
  fetchOnFirstRender = true,
  modelAvailableRequired,
}) => {
  const fetchPanelElements = useFetchPanelElements({ panelId });

  const {
    elements,
    hitCount,
    page: currentPage,
    pairs,
  } = useSelector((state) => (panelId ? state.workspace.panels[panelId] : elementsInitialState));

  const curCategory = useSelector((state) => state.workspace.curCategory);
  const modelVersion = useSelector((state) => state.workspace.modelVersion);

  const pageCount = React.useMemo(() => {
    return getPageCount(elementsPerPage, hitCount);
  }, [elementsPerPage, hitCount]);

  const dispatch = useDispatch();
  const firstRenderHappened = React.useRef(false);

  const modelAvailable = React.useMemo(() => curCategory !== null && modelVersion !== null && modelVersion > 0, [curCategory, modelVersion]);

  /**
   * The elements that has to be displayed in the current page
   * If real pagination is being used, the elements object already containes
   * the elements that has to be displayed in the current page.
   * If using fake pagination, return a slice of the elements.
   */

  const currentContentData = React.useMemo(() => {
    if (elements === null) return null;
    else {
      if (fakePagination) {
        const startIndex = (currentPage - 1) * elementsPerPage;
        return Object.values(elements).slice(startIndex, startIndex + elementsPerPage);
      } else {
        if (panelId === panelIds.CONTRADICTING_LABELS) {
          return pairs.flat();
        } else {
          return Object.values(elements);
        }
      }
    }
  }, [elements, currentPage, elementsPerPage, fakePagination, pairs, panelId]);

  const isPaginationRequired = React.useMemo(
    () => currentContentData !== null && hitCount > elementsPerPage,
    [currentContentData, elementsPerPage, hitCount]
  );

  React.useEffect(() => {
    if (
      !fakePagination &&
      shouldFetch &&
      (fetchOnFirstRender || firstRenderHappened.current) &&
      (!modelAvailableRequired || modelAvailable)
    ) {
      // console.log(panelId)
      // console.log(`modelAvailableRequired: ${modelAvailableRequired}`)
      // console.log(`modelAvailable: ${modelAvailable}`)
      fetchPanelElements();
    }
  }, [
    currentPage,
    fakePagination,
    dispatch,
    fetchOnFirstRender,
    firstRenderHappened,
    fetchPanelElements,
    modelAvailableRequired,
    modelAvailable,
    ...otherDependencies,
  ]);

  const resetPagination = () => dispatch(setPage({ panelId, newPage: 1 }));

  const setCurrentPage = React.useCallback((newPage) => dispatch(setPage({ panelId, newPage })), [panelId, dispatch]);

  const onPageChange = (event, value) => setCurrentPage(value);

  const nextPage = React.useCallback(() => {
    if (currentPage === pageCount) return;
    setCurrentPage(currentPage + 1);
  }, [currentPage, pageCount, setCurrentPage]);

  const previousPage = React.useCallback(() => {
    if (currentPage === 1) return;
    setCurrentPage(currentPage - 1);
  }, [currentPage, setCurrentPage]);

  /**
   * IMPORTANT
   * useEffect callbacks are executed in order
   * this effect needs to be executed at last
   * so it is false during the first render
   * lifecycle:
   * - state update
   * - DOM computation
   * - DOM printing
   * - useEffect callbacks execution
   */
  React.useEffect(() => {
    firstRenderHappened.current = true;
  }, []);

  return {
    currentContentData,
    hitCount,
    setCurrentPage,
    currentPage,
    resetPagination,
    onPageChange,
    isPaginationRequired,
    previousPage,
    nextPage,
    pageCount,
  };
};

export default usePanelPagination;
