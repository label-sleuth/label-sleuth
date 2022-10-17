import { useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  resetSearchResults,
  setSearchInput,
  resetLastSearchString,
} from "../../redux/DataSlice";
import { panelIds } from "../../../../const";
import { useFetchPanelElements } from "../../customHooks/useFetchPanelElements";

/**
 * Custom hook that manages the state of the search sidebal panel.
 * @param {A reference to the input to clear and focus it} textInputRef
 * @returns
 */
export const useUpdateSearch = (textInputRef) => {
  const uploadedLabels = useSelector((state) => state.workspace.uploadedLabels);
  const curCategory = useSelector((state) => state.workspace.curCategory);
  const lastSearchString = useSelector(
    (state) => state.workspace.panels[panelIds.SEARCH].lastSearchString
  );

  const dispatch = useDispatch();

  const { fetchPanelElements } = useFetchPanelElements();

  /**
   * Clear the search sidebar panel by reseting the
   * input in the redux state, clearing the current of
   * the input reference and clearing the results of the
   * last query.
   */
  const clearSearch = useCallback(() => {
    dispatch(setSearchInput(""));

    dispatch(resetSearchResults());

    if (textInputRef.current) {
      textInputRef.current.value = "";
      textInputRef.current.focus();
    }
  }, [dispatch, textInputRef]);

  /**
   * Clear the search state when the category changes
   */
  useEffect(() => {
    clearSearch();
    dispatch(resetLastSearchString());
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [curCategory, clearSearch, dispatch, textInputRef]);

  /**
   * When uploading labels, update the search results
   * using the last searched string because user labels
   * may have changed
   */
  useEffect(() => {
    uploadedLabels &&
      lastSearchString &&
      fetchPanelElements({
        panelId: panelIds.SEARCH,
        useLastSearchString: true,
      });
  }, [uploadedLabels, lastSearchString, dispatch]);

  return clearSearch;
};
