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

import { PanelIdsEnum } from "../const";
import { fetchDocumentElements } from "../modules/Workplace/redux/panelsSlice";
import { searchKeywords } from "../modules/Workplace/redux/panelsSlice";
import { getElementToLabel } from "../modules/Workplace/redux/panelsSlice";
import { getModelPredictions } from "../modules/Workplace/redux/panelsSlice";
import { getUserLabels } from "../modules/Workplace/redux/panelsSlice";
import { getSuspiciousLabels } from "../modules/Workplace/redux/panelsSlice";
import { getContradictingLabels } from "../modules/Workplace/redux/panelsSlice";
import { getEvaluationElements } from "../modules/Workplace/redux/evaluationSlice";
import { useCallback, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "./useRedux";
import { FetchPanelElementsParams } from "../global";

const getFetchActionByPanelId = (panelId: PanelIdsEnum) => {
  switch (panelId) {
    case PanelIdsEnum.MAIN_PANEL:
      return fetchDocumentElements;
    case PanelIdsEnum.SEARCH:
      return searchKeywords;
    case PanelIdsEnum.LABEL_NEXT:
      return getElementToLabel;
    case PanelIdsEnum.MODEL_PREDICTIONS:
      return getModelPredictions;
    case PanelIdsEnum.USER_LABELS:
      return getUserLabels;
    case PanelIdsEnum.SUSPICIOUS_LABELS:
      return getSuspiciousLabels;
    case PanelIdsEnum.CONTRADICTING_LABELS:
      return getContradictingLabels;
    case PanelIdsEnum.EVALUATION:
      return getEvaluationElements;
    default:
      return null;
  }
};

export const useFetchPanelElements = ({
  panelId,
}: {
  panelId: PanelIdsEnum;
}) => {
  const dispatch = useAppDispatch();
  const { mainPanelElementsPerPage, sidebarPanelElementsPerPage } =
    useAppSelector((state) => state.featureFlags);
  const panel = useAppSelector((state) =>
    panelId !== PanelIdsEnum.NOT_SET
      ? state.workspace.panels.panels[panelId]
      : null
  );
  const page = useMemo(() => (panel ? panel.page : -1), [panel]);

  const fetchPanelElements = useCallback(
    (params: FetchPanelElementsParams = {}) => {
      if (panelId !== PanelIdsEnum.NOT_SET) {
        const elementsPerPage =
          panelId === PanelIdsEnum.MAIN_PANEL
            ? mainPanelElementsPerPage
            : sidebarPanelElementsPerPage;
        const startIndex = (page - 1) * elementsPerPage;
        const pagination = {
          startIndex,
          elementsPerPage,
        };
        const fetchAction = getFetchActionByPanelId(panelId);
        if (fetchAction !== null) {
          dispatch(fetchAction({ pagination, ...params }));
        }
      }
    },
    [
      panelId,
      mainPanelElementsPerPage,
      sidebarPanelElementsPerPage,
      page,
      dispatch,
    ]
  );

  return fetchPanelElements;
};

export const useUpdateActivePanelElements = () => {
  const lastSearchString = useAppSelector(
    (state) =>
      state.workspace.panels.panels[PanelIdsEnum.SEARCH].lastSearchString
  );
  const activePanelId = useAppSelector(
    (state) => state.workspace.panels.activePanelId
  );

  const fetchActivePanelElements = useFetchPanelElements({
    panelId: activePanelId,
  });

  const updateActivePanelElements = useCallback(
    (value?: string) => {
      if (activePanelId !== PanelIdsEnum.SEARCH || lastSearchString) {
        fetchActivePanelElements({ value });
      }
    },
    [activePanelId, lastSearchString, fetchActivePanelElements]
  );

  return { updateActivePanelElements };
};
