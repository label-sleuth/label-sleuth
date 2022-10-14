import { useEffect } from "react";
import { getPanelDOMKey, scrollIntoElementView } from "../../../../utils/utils";
import { useDispatch, useSelector } from "react-redux";
import { panelIds } from "../../../../const";
/**
 * This custom hook manage the behaviour of
 * scrolling into an element in the main panel
 * when one has been clicked in a sidebar panel
 */
const useScrollMainPanelElementIntoView = () => {
  const dispatch = useDispatch();
  const { elements } = useSelector((state) => state.workspace.panels[panelIds.MAIN_PANEL]);

  const { DOMKey: focusedElementDOMKey, hackyToggle } = useSelector((state) => state.workspace.panels.focusedElement);

  useEffect(() => {
    let element;
    if (focusedElementDOMKey !== null) {
      element = document.getElementById(focusedElementDOMKey);
      scrollIntoElementView(element);
    } else if (elements && Object.keys(elements).length > 0) {
      // if there is no focused element, scroll into the first element of the list instead
      const firstElement = Object.values(elements)[0];
      const firstElementDOMKey = getPanelDOMKey(firstElement.id, panelIds.MAIN_PANEL);
      element = document.getElementById(firstElementDOMKey);
      scrollIntoElementView(element, false);
    }
  }, [focusedElementDOMKey, hackyToggle, elements, dispatch]);
};

export default useScrollMainPanelElementIntoView;
