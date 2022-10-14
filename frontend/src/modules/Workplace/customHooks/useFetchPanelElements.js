import { useDispatch, useSelector } from "react-redux";
import { panelIds } from "../../../const";
import { fetchDocumentElements } from "../redux/panelsSlice";
import { searchKeywords } from "../redux/panelsSlice";
import { getElementToLabel } from "../redux/panelsSlice";
import { getPositivePredictions } from "../redux/panelsSlice";
import { getAllPositiveLabels } from "../redux/panelsSlice";
import { getSuspiciousLabels } from "../redux/panelsSlice";
import { getContradictingLabels } from "../redux/panelsSlice";
import { getEvaluationElements } from "../redux/evaluationSlice";
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