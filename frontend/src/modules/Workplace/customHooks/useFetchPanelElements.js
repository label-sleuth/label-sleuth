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
import { useCallback } from "react";

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

export const useFetchPanelElements = () => {
  const dispatch = useDispatch();
  const { mainPanelElementsPerPage, sidebarPanelElementsPerPage } = useSelector(
    (state) => state.featureFlags
  );
  const panels = useSelector((state) => state.workspace.panels);

  const fetchPanelElements = ({ panelId, ...rest } = {}) => {
    if (panelId) {
      const elementsPerPage =
        panelId === panelIds.MAIN_PANEL
          ? mainPanelElementsPerPage
          : sidebarPanelElementsPerPage;

      const startIndex = (panels[panelId].page - 1) * elementsPerPage;

      const pagination = {
        startIndex,
        elementsPerPage,
      };
      const fetchAction = getFetchActionByPanelId(panelId);
      dispatch(fetchAction({ pagination, ...rest }));
    }
  };

  const updateActivePanelElements = () => {
    const activePanelId = panels.activePanelId;
    if (
      activePanelId !== panelIds.SEARCH ||
      panels[panelIds.SEARCH].lastSearchString
    ) {
      fetchPanelElements({ panelId: activePanelId });
    }
  };

  return { fetchPanelElements, updateActivePanelElements };
};
