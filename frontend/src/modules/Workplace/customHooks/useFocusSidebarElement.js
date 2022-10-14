import { useSelector } from "react-redux";
import { useEffect } from "react";
import { getPanelDOMKey, scrollIntoElementView } from "../../../utils/utils";
import { focusedSidebarElementSelector } from "../redux/panelsSlice";

export const useFocusSidebarElement = () => {
  const { index: focusedSidebarElementIndex } = useSelector((state) => state.workspace.panels.focusedSidebarElement);
  const focusedElement = useSelector(focusedSidebarElementSelector);
  const activePanelId = useSelector((state) => state.workspace.panels.activePanelId);
  const activePanel = useSelector((state) => state.workspace.panels[activePanelId]);

  useEffect(() => {
    if (focusedElement === null) return;
    const focusedSidebarElementDOMKey = getPanelDOMKey(focusedElement.id, activePanelId, focusedSidebarElementIndex);
    const element = document.getElementById(focusedSidebarElementDOMKey);
    scrollIntoElementView(element);

  }, [focusedElement, focusedSidebarElementIndex, activePanel, activePanelId]);
};
