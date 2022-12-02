import { useSelector } from "react-redux";
import { useEffect, useMemo } from "react";
import { getPanelDOMKey, scrollIntoElementView } from "../../../utils/utils";
import { focusedSidebarElementSelector } from "../redux/panelsSlice";

export const useFocusSidebarElement = () => {
  const { index: focusedSidebarElementIndex } = useSelector((state) => state.workspace.panels.focusedSidebarElement);
  const focusedElement = useSelector(focusedSidebarElementSelector);
  const activePanelId = useSelector((state) => state.workspace.panels.activePanelId);
  const focusedElementId = useMemo(() => focusedElement === null ? null : focusedElement.id, [focusedElement])

  useEffect(() => {
    if (focusedElementId === null) return;
    const focusedSidebarElementDOMKey = getPanelDOMKey(focusedElementId, activePanelId, focusedSidebarElementIndex);
    const element = document.getElementById(focusedSidebarElementDOMKey);
    scrollIntoElementView(element);
  }, [focusedElementId, focusedSidebarElementIndex, activePanelId]);
};
