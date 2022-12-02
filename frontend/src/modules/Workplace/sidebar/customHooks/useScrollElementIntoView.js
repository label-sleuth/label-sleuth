import { useEffect, useMemo, useState } from "react";
import { getPanelDOMKey, scrollIntoElementView } from "../../../../utils/utils";
import { useDispatch, useSelector } from "react-redux";
import { panelIds } from "../../../../const";
import { usePrevious } from "../../../../customHooks/usePrevious";
/**
 * This custom hook manage the behaviour of
 * scrolling into an element in the main panel
 * when one has been clicked in a sidebar panel
 */
const useScrollMainPanelElementIntoView = () => {
  const dispatch = useDispatch();
  const { DOMKey: focusedElementDOMKey, hackyToggle } = useSelector((state) => state.workspace.panels.focusedElement);

  /**
   * The following variables are used to only trigger the effect that
   * is in charge of scrolling main elements into view when required, and that is
   * when focused element changes or when the document changes.
   *
   * elements is an object with key as elementid and the information of that element as its value
   * elementKeys is an array with the keys of `elements`
   * previousElementKeys is the value of the past `elementKeys` in case they changed
   * elementKeysState changes only when a deep comparisson (arrayEquals) between `previousElementKeys` and `previousElementKeys` gives false
   */

  const { elements } = useSelector((state) => state.workspace.panels[panelIds.MAIN_PANEL]);
  const elementKeys = useMemo(() => (elements ? Object.keys(elements) : null), [elements]);
  const firstElementId = useMemo(
    () => (elementKeys !== null && elementKeys.length > 0 ? elementKeys[0] : null),
    [elementKeys]
  );
  const previousElementKeys = usePrevious(elementKeys);
  const [elementKeysState, setElementKeysState] = useState(elementKeys);

  const arrayEquals = (a, b) => {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((val, index) => val === b[index]);
  };

  useEffect(() => {
    if (!arrayEquals(previousElementKeys, elementKeys)) {
      setElementKeysState(elementKeys);
    }
  }, [previousElementKeys, elementKeys]);

  useEffect(() => {
    let element;
    if (focusedElementDOMKey !== null) {
      element = document.getElementById(focusedElementDOMKey);
      scrollIntoElementView(element);
    } else if (firstElementId) {
      // if there is no focused element, scroll into the first element of the list instead
      const firstElementDOMKey = getPanelDOMKey(firstElementId, panelIds.MAIN_PANEL);
      element = document.getElementById(firstElementDOMKey);
      scrollIntoElementView(element, false);
    }
  }, [firstElementId, focusedElementDOMKey, hackyToggle, elementKeysState, dispatch]);
};

export default useScrollMainPanelElementIntoView;
