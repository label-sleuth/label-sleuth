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

import { useDispatch, useSelector } from "react-redux";
import { panelIds } from "../const";
import { fetchDocumentElements } from "../modules/Workplace/redux/panelsSlice";
import { searchKeywords } from "../modules/Workplace/redux/panelsSlice";
import { getElementToLabel } from "../modules/Workplace/redux/panelsSlice";
import { getPositivePredictions } from "../modules/Workplace/redux/panelsSlice";
import { getAllPositiveLabels } from "../modules/Workplace/redux/panelsSlice";
import { getSuspiciousLabels } from "../modules/Workplace/redux/panelsSlice";
import { getContradictingLabels } from "../modules/Workplace/redux/panelsSlice";
import { getEvaluationElements } from "../modules/Workplace/redux/evaluationSlice";
import { useCallback, useMemo } from "react";

const getFetchActionByPanelId = (panelId) => {
  switch (panelId) {
    case panelIds.MAIN_PANEL:
      return fetchDocumentElements;
    case panelIds.SEARCH:
      return searchKeywords;
    case panelIds.LABEL_NEXT:
      return getElementToLabel;
    case panelIds.POSITIVE_PREDICTIONS:
      return getPositivePredictions;
    case panelIds.POSITIVE_LABELS:
      return getAllPositiveLabels;
    case panelIds.SUSPICIOUS_LABELS:
      return getSuspiciousLabels;
    case panelIds.CONTRADICTING_LABELS:
      return getContradictingLabels;
    case panelIds.EVALUATION:
      return getEvaluationElements;
    default:
      return null;
  }
};

export const useFetchPanelElements = ({ panelId }) => {
  const dispatch = useDispatch();
  const { mainPanelElementsPerPage, sidebarPanelElementsPerPage } = useSelector((state) => state.featureFlags);
  const panel = useSelector((state) => state.workspace.panels[panelId]);
  const page = useMemo(() => panel ? panel.page : null, [panel]);

  const fetchPanelElements = useCallback(
    (params = {}) => {
      if (panelId) {
        const elementsPerPage =
          panelId === panelIds.MAIN_PANEL ? mainPanelElementsPerPage : sidebarPanelElementsPerPage;

        const startIndex = (page - 1) * elementsPerPage;

        const pagination = {
          startIndex,
          elementsPerPage,
        };
        const fetchAction = getFetchActionByPanelId(panelId);
        dispatch(fetchAction({ pagination, ...params }));
      }
    },
    [panelId, mainPanelElementsPerPage, sidebarPanelElementsPerPage, page, dispatch]
  );

  return fetchPanelElements;
};

export const useUpdateActivePanelElements = () => {
  const lastSearchString = useSelector((state) => state.workspace.panels[panelIds.SEARCH].lastSearchString);
  const activePanelId = useSelector((state) => state.workspace.panels.activePanelId);

  const fetchActivePanelElements = useFetchPanelElements({panelId: activePanelId});
  
  const updateActivePanelElements = useCallback(() => {
    if (activePanelId !== panelIds.SEARCH || lastSearchString) {
      fetchActivePanelElements();
    };
  }, [activePanelId, lastSearchString, fetchActivePanelElements]);

  return { updateActivePanelElements }
}