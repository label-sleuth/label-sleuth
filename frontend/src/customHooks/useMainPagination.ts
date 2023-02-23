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

import { useCallback } from "react";
import "../components/pagination/pagination.css";
import { PanelIdsEnum } from "../const";
import usePanelPagination from "./usePanelPagination";
import { clearMainPanelFocusedElement } from "../modules/Workplace/redux";
import { useAppDispatch, useAppSelector } from "./useRedux";

export const useMainPagination = (elementsPerPage: number) => {
  const curCategory = useAppSelector((state) => state.workspace.curCategory);
  const curDocIndex = useAppSelector((state) => state.workspace.curDocIndex);
  const modelVersion = useAppSelector((state) => state.workspace.modelVersion);
  const page = useAppSelector((state) => state.workspace.panels.panels[PanelIdsEnum.MAIN_PANEL].page);
  const dispatch = useAppDispatch();

  // (curCategory === null || modelVersion !== null) means category isn't selected or model version has been set
  // note: when modelVersion is null means that it hasn't been set
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
    panelId: PanelIdsEnum.MAIN_PANEL,
    shouldFetch: curDocIndex !== null && page !== null && (curCategory === null || modelVersion !== null),
    modelAvailableRequired: false,
    otherDependencies: [curDocIndex, curCategory, modelVersion],
  });

  const onMainPageChange = useCallback(
    (event, value) => {
      dispatch(clearMainPanelFocusedElement());
      onPageChange(event, value);
    },
    [dispatch, onPageChange]
  );

  return {
    currentContentData,
    hitCount,
    currentPage,
    setCurrentPage,
    resetPagination,
    onPageChange: onMainPageChange,
    isPaginationRequired,
  };
};
