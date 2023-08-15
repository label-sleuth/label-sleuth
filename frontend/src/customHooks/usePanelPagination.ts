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
import "../components/pagination/pagination.css";
import { setPage } from "../modules/Workplace/redux";
import { useFetchPanelElements } from "./useFetchPanelElements";
import { getPageCount } from "../utils/utils";
import { elementsInitialState } from "../modules/Workplace/redux/panelsSlice";
import { PanelIdsEnum } from "../const";
import { useAppSelector, useAppDispatch } from "./useRedux";
import { Element } from "../global";
interface UsePanelPaginationProps {
  elementsPerPage: number;
  panelId: PanelIdsEnum;
  shouldFetch?: boolean;
  otherDependencies?: any[];
  fakePagination?: boolean;
  fetchOnFirstRender?: boolean;
  modelAvailableRequired?: boolean;
  value?: string;
}

const usePanelPagination = ({
  elementsPerPage,
  panelId,
  shouldFetch = true,
  otherDependencies = [],
  fakePagination = false,
  fetchOnFirstRender = true,
  modelAvailableRequired,
  value,
}: UsePanelPaginationProps) => {
  const fetchPanelElements = useFetchPanelElements({ panelId });
  const {
    elements,
    hitCount,
    page: currentPage,
  } = useAppSelector((state) =>
    panelId ? state.workspace.panels.panels[panelId] : elementsInitialState
  );

  const pairs = useAppSelector((state) =>
    panelId === PanelIdsEnum.CONTRADICTING_LABELS
      ? state.workspace.panels.panels[panelId].pairs
      : []
  );

  const dispatch = useAppDispatch();

  const curCategory = useAppSelector((state) => state.workspace.curCategory);
  const modelVersion = useAppSelector((state) => state.workspace.modelVersion);

  const pageCount = React.useMemo(() => {
    return getPageCount(elementsPerPage, hitCount);
  }, [elementsPerPage, hitCount]);

  const firstRenderHappened = React.useRef(false);

  const modelAvailable = React.useMemo(
    () => modelVersion !== null && modelVersion > 0,
    [modelVersion]
  );

  /**
   * The elements that has to be displayed in the current page
   * If real pagination is being used, the elements object already contains
   * the elements that has to be displayed in the current page.
   * If using fake pagination, return a slice of the elements.
   */
  const currentContentData: Element[] | string[] | null = React.useMemo(() => {
    if (elements === null) return null;
    else {
      if (fakePagination) {
        const startIndex = (currentPage - 1) * elementsPerPage;
        return Object.values(elements).slice(
          startIndex,
          startIndex + elementsPerPage
        );
      } else {
        if (panelId === PanelIdsEnum.CONTRADICTING_LABELS) {
          return pairs.flat();
        } else {
          return elements !== null ? Object.values(elements) : null;
        }
      }
    }
  }, [elements, currentPage, elementsPerPage, fakePagination, pairs, panelId]);

  const isPaginationRequired = React.useMemo(
    () =>
      currentContentData !== null &&
      hitCount !== null &&
      hitCount > elementsPerPage,
    [currentContentData, elementsPerPage, hitCount]
  );
  React.useEffect(
    () => {
      if (
        !fakePagination &&
        shouldFetch &&
        (fetchOnFirstRender || firstRenderHappened.current) &&
        (!modelAvailableRequired || modelAvailable)
      ) {
        fetchPanelElements(value ? { value } : undefined);
      }
    },
    // disable eslint on some lines
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      currentPage,
      fakePagination,
      dispatch,
      fetchOnFirstRender,
      firstRenderHappened,
      fetchPanelElements,
      modelAvailableRequired,
      modelAvailable,
      value,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      ...otherDependencies,
    ]
  );

  const resetPagination = () => {
    dispatch(setPage({ panelId, newPage: 1 }));
  };

  const setCurrentPage = React.useCallback(
    (newPage: number) => dispatch(setPage({ panelId, newPage })),
    [panelId, dispatch]
  );

  const onPageChange = (event: React.UIEvent, value: number) =>
    setCurrentPage(value);

  const goToNextPage = React.useCallback(() => {
    if (currentPage === pageCount) return;
    setCurrentPage(currentPage + 1);
  }, [currentPage, pageCount, setCurrentPage]);

  const goToPreviousPage = React.useCallback(() => {
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
    goToPreviousPage,
    goToNextPage,
    pageCount,
  };
};

export default usePanelPagination;
