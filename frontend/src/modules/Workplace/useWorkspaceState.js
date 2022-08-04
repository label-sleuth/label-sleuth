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

import {
  getLabelNext,
  checkStatus,
  fetchCategories,
  fetchDocuments,
  setIsDocLoaded,
  setIsCategoryLoaded,
  checkModelUpdate,
  fetchElements,
  getPosPredElementForCategory,
  setFocusedState,
  getPositivePredictions,
  setWorkspaceVisited,
  searchKeywords,
  getSuspiciousLabels,
  getAllPositiveLabels,
  cleanEvaluationState,
} from "./DataSlice.jsx";
import * as React from "react";
import { useDispatch, useSelector } from "react-redux";

/**
 * Custom hook for dispatching workspace related actions
 **/
const useWorkspaceState = () => {
  const dispatch = useDispatch();
  const workspace = useSelector((state) => state.workspace);

  React.useEffect(() => {
    // fetch documents only once, they won't change
    dispatch(setIsCategoryLoaded(false));
    dispatch(setIsDocLoaded(false));
    dispatch(fetchDocuments()).then(() => {
      dispatch(fetchElements()).then(() => {
        dispatch(setIsCategoryLoaded(true));
        dispatch(setIsDocLoaded(true));
      });
    });
    // fetch categories only once, they will be fetched again if a new category is added
    dispatch(fetchCategories());

    if (!workspace.workspaceVisited) {
      dispatch(setWorkspaceVisited())
    }

  }, [dispatch]);

  React.useEffect(() => {
    // elements has to be re-fetched when the category changes
    dispatch(setIsCategoryLoaded(false));
    dispatch(setIsDocLoaded(false));
    dispatch(fetchElements()).then(() => {
      dispatch(setIsCategoryLoaded(true));
      dispatch(setIsDocLoaded(true));
    })

    // reset the focused state when the category changes
    dispatch(setFocusedState(null));
    // update the model version when the category changes (if any)
    if (workspace.curCategory !== null) {
      dispatch(checkModelUpdate());
      dispatch(getAllPositiveLabels())
      dispatch(cleanEvaluationState())
    }
  }, [workspace.curCategory, dispatch]);

  React.useEffect(() => {
    // category changes or model_version changes means
    // that recommend to label and positive predicted text entries has to be updated
    // also the status is updated
    if (workspace.curCategory !== null) {
      dispatch(checkStatus());
      // checking for nullity first because in js null >= 0
      if (workspace.model_version !== null && workspace.model_version >= 0) {
        dispatch(fetchElements())
        dispatch(getLabelNext());
        dispatch(getPosPredElementForCategory());
        dispatch(getPositivePredictions())
        // dispatch(getDisagreementsElements())
        dispatch(getSuspiciousLabels())
        // updates search results because predictions may have changed
        workspace.searchInput !== null && workspace.searchInput !== '' && dispatch(searchKeywords()) 
      }
    }
  }, [workspace.curCategory, workspace.model_version, dispatch]);

  React.useEffect(() => {
    // this useEffect manages the actions to be carried out when new labels have been imported
    // if new categories where added the category list is fetched again
    // if the user is currently in a category where labels have been added then the document is
    // fetched again, as well as the search bar results (in case element labels has to be updated there)
    if (workspace.uploadedLabels) {
      const { categories, categoriesCreated } = workspace.uploadedLabels;
      if (categories?.some(cat => cat.category_id == workspace.curCategory)) {
        dispatch(setIsCategoryLoaded(false));
        dispatch(setIsDocLoaded(false));
        dispatch(getAllPositiveLabels())
        dispatch(fetchElements()).then(() => {
          if (workspace.searchInput) {
            dispatch(searchKeywords()).then(() => {
              dispatch(setIsCategoryLoaded(true));
              dispatch(setIsDocLoaded(true));
            });
          } else {
            dispatch(setIsCategoryLoaded(true));
            dispatch(setIsDocLoaded(true));
          }
          dispatch(checkStatus());
        });
      }
      if (categoriesCreated) {
        dispatch(fetchCategories());
      }
    }
  }, [workspace.uploadedLabels]);

};

export default useWorkspaceState;
