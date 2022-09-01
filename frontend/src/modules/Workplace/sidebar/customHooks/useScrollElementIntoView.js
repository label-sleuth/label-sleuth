import { useEffect } from "react";
import { scrollIntoElementView } from "../../../../utils/utils";
import { useSelector } from "react-redux";
import { panelIds } from "../../../../const";

const useScrollMainPanelElementIntoView = () => {
    const mainPanelLoading = useSelector((state) => state.workspace.panels.loading[panelIds.MAIN_PANEL]);
    const focusedElementDOMKey = useSelector((state) => state.workspace.panels.focusedElement.DOMKey);


    useEffect(() => {
      if (!mainPanelLoading && focusedElementDOMKey) {
        const element = document.getElementById(focusedElementDOMKey);
        scrollIntoElementView(element);
      }
    }, [mainPanelLoading, focusedElementDOMKey]);
  }

  export default useScrollMainPanelElementIntoView;