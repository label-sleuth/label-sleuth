import { useEffect } from "react";
import {
  scrollIntoElementView,
} from "../../../../utils/utils";
import { useDispatch, useSelector } from "react-redux";
import { panelIds } from "../../../../const";
import { setFocusedElement } from "../../redux/DataSlice";

/**
 * This custom hook manage the behaviour of
 * scrolling into an element in the main panel
 * when one has been clicked in a sidebar panel
 */
const useScrollMainPanelElementIntoView = () => {
  const mainPanelLoading = useSelector(
    (state) => state.workspace.panels.loading[panelIds.MAIN_PANEL]
  );
  const dispatch = useDispatch();
  const { elements } = useSelector(
    (state) => state.workspace.panels[panelIds.MAIN_PANEL]
  );

  const { DOMKey: focusedElementDOMKey, hackyToggle } = useSelector(
    (state) => state.workspace.panels.focusedElement
  );

  useEffect(() => {
    if (!mainPanelLoading && focusedElementDOMKey !== null) {
      const element = document.getElementById(focusedElementDOMKey);
      //element && dispatch(setFocusedElement({element: null}))
      scrollIntoElementView(element);
    }
  }, [mainPanelLoading, focusedElementDOMKey, hackyToggle, elements, dispatch]);
};

export default useScrollMainPanelElementIntoView;
