import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { changeCurrentDocument, setFocusedMainPanelElement } from "../redux/DataSlice";

export const useFocusMainPanelElement = () => {
  const dispatch = useDispatch();
  const mainPanelElementsPerPage = useSelector((state) => state.featureFlags.mainPanelElementsPerPage);

  const focusMainPanelElement = useCallback(({ element, docId }) => {
    dispatch(setFocusedMainPanelElement({ element, highlight: true }));
    dispatch(changeCurrentDocument({newDocId: docId, mainPanelElementsPerPage}));
  }, [dispatch, mainPanelElementsPerPage]);

  return { focusMainPanelElement };
};
