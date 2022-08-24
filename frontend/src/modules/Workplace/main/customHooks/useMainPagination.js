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

import * as React from "react";
import { useSelector } from "react-redux";
import "../../../../components/pagination/pagination.css";
import { panelIds } from "../../../../const";

const useMainPagination = (numOfElemPerPage) => {
  const curDocId = useSelector((state) => state.workspace.curDocId);
  const elements = useSelector(
    (state) => state.workspace.panels[panelIds.MAIN_PANEL].elements
  );
  const focusedElementId = useSelector(
    (state) => state.workspace.panels.focusedElement.id
  );

  const mainElementIndex = React.useMemo(
    () =>
      elements &&
      focusedElementId &&
      Object.values(elements).findIndex((e) => e.id === focusedElementId),
    [elements, focusedElementId]
  );

  const [currentPage, setCurrentPage] = React.useState(1);
  let [firstPageIndex, setFirstPageIndex] = React.useState();
  let [lastPageIndex, setLastPageIndex] = React.useState();

  let currPageNum = React.useMemo(
    () => Math.ceil(mainElementIndex / numOfElemPerPage),
    [mainElementIndex, numOfElemPerPage]
  );
  let currPageNumMod = React.useMemo(
    () => mainElementIndex % numOfElemPerPage,
    [mainElementIndex, numOfElemPerPage]
  );

  React.useEffect(() => {
    if (!focusedElementId) {
      setCurrentPage(1);
    } else {
      if (currPageNumMod === 0) {
        setCurrentPage(currPageNum + 1);
      } else {
        setCurrentPage(currPageNum);
      }
    }
  }, [curDocId, focusedElementId, setCurrentPage, currPageNum, currPageNumMod]);

  const currentContentData = React.useMemo(() => {
    if (elements) {
      let firstPageIndex = 0;

      if (currentPage > 0) {
        firstPageIndex = (currentPage - 1) * numOfElemPerPage;
      }

      const lastPageIndex = firstPageIndex + numOfElemPerPage;
      setFirstPageIndex(firstPageIndex);
      setLastPageIndex(lastPageIndex);
      return Object.values(elements).slice(firstPageIndex, lastPageIndex);
    }
  }, [elements, currentPage, numOfElemPerPage]);

  return {
    currentContentData,
    setCurrentPage,
    currentPage,
    lastPageIndex,
    firstPageIndex,
  };
};

export default useMainPagination;
