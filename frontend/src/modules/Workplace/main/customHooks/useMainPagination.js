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

import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import "../../../../components/pagination/pagination.css";
import { panelIds } from "../../../../const";
import usePanelPagination from "../../../../customHooks/usePanelPagination";
import { getElementIndex } from "../../../../utils/utils";

const useUpdateFocusedPage = (
  mainElementIndex,
  elementsPerPage,
  setCurrentPage
) => {

  /**
   * Update the focused page when a main element has to be focused
   */
  useEffect(() => {
    const focusedPage =
      mainElementIndex !== null
        ? Math.floor(mainElementIndex / elementsPerPage) + 1
        : null;
    focusedPage && setCurrentPage(focusedPage);
  }, [mainElementIndex, elementsPerPage, setCurrentPage]);
};

const useMainPagination = (elementsPerPage) => {
  const isDocLoaded = useSelector((state) => state.workspace.isDocLoaded);
  const curDocId = useSelector((state) => state.workspace.curDocName);
  const curCategory = useSelector((state) => state.workspace.curCategory);
  const modelVersion = useSelector((state) => state.workspace.modelVersion);
  const focusedElementId = useSelector(
    (state) => state.workspace.panels.focusedElement.id
  );

  const mainElementIndex = useMemo(
    () => (focusedElementId ? getElementIndex(focusedElementId) : null),
    [focusedElementId]
  );

  const {
    currentContentData,
    hitCount,
    setCurrentPage,
    currentPage,
    resetPagination,
    onPageChange,
    isPaginationRequired,
  } = usePanelPagination({
    elementsPerPage,
    panelId: panelIds.MAIN_PANEL,
    shouldFetch: isDocLoaded,
    otherDependencies: [curDocId, isDocLoaded, curCategory, modelVersion],
  });

  useUpdateFocusedPage(mainElementIndex, elementsPerPage, setCurrentPage);

  return {
    currentContentData,
    hitCount,
    currentPage,
    setCurrentPage,
    resetPagination,
    onPageChange,
    isPaginationRequired,
  };
};

export default useMainPagination;
