/*
    Copyright (c) 2022 IBM Corp.
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

import { useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { resetSearchResults, setSearchInput, resetLastSearchString } from "../modules/Workplace/redux/DataSlice";
import { panelIds } from "../const";
import { useFetchPanelElements } from "./useFetchPanelElements";

/**
 * Custom hook that manages the state of the search sidebal panel.
 * @param {A reference to the input to clear and focus it} textInputRef
 * @returns
 */
export const useUpdateSearch = (textInputRef) => {
  const uploadedLabels = useSelector((state) => state.workspace.uploadedLabels);
  
  const curCategory = useSelector((state) => state.workspace.curCategory);
  const lastSearchString = useSelector((state) => state.workspace.panels[panelIds.SEARCH].lastSearchString);

  const dispatch = useDispatch();

  const fetchSearchPanelElements = useFetchPanelElements({ panelId: panelIds.SEARCH });

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
    if (uploadedLabels !== null && lastSearchString !== null) {
      fetchSearchPanelElements({ useLastSearchString: true });
    }
  }, [uploadedLabels, lastSearchString, fetchSearchPanelElements, dispatch]);

  return clearSearch;
};
