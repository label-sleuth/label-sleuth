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
import { setPage } from "../modules/Workplace/redux/DataSlice";
import { useFetchPanelElements } from "../modules/Workplace/customHooks/useFetchPanelElements";

const usePanelPagination = ({
  elementsPerPage,
  panelId,
  shouldFetch = true,
  otherDependencies = [],
  fakePagination = false,
  fetchOnFirstRender = true,
}) => {
  // useWhyDidYouUpdate("usePanelPagination", {panelId, shouldFetch, ...otherDependencies})
  const { fetchPanelElements } = useFetchPanelElements();

  const {
    elements,
    hitCount,
    page: currentPage,
  } = useSelector((state) => state.workspace.panels[panelId]);

  const dispatch = useDispatch();
  const firstRenderHappened = React.useRef(false);

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
        return Object.values(elements).slice(
          startIndex,
          startIndex + elementsPerPage
        );
      } else {
        return Object.values(elements);
      }
    }
  }, [elements, currentPage, elementsPerPage, fakePagination]);

  const isPaginationRequired = React.useMemo(
    () => currentContentData !== null && hitCount > elementsPerPage,
    [currentContentData, elementsPerPage, hitCount]
  );

  React.useEffect(() => {
    if (
      !fakePagination &&
      shouldFetch &&
      (fetchOnFirstRender || firstRenderHappened.current)
    ) {
      fetchPanelElements({
        panelId,
      });
    }
  }, [
    panelId,
    currentPage,
    fakePagination,
    dispatch,
    fetchOnFirstRender,
    firstRenderHappened,
    ...otherDependencies,
  ]);

  const resetPagination = () => dispatch(setPage({ panelId, newPage: 1 }));

  const setCurrentPage = React.useCallback(
    (newPage) => dispatch(setPage({ panelId, newPage })),
    [panelId, dispatch]
  );

  const onPageChange = (event, value) => setCurrentPage(value);

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
  };
};

export default usePanelPagination;
