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
  checkStatus,
  fetchCategories,
  fetchDocuments,
  checkModelUpdate,
  setWorkspaceVisited,
  cleanEvaluationState,
  cleanUploadedLabels,
} from "../redux/DataSlice";
import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { panelIds } from "../../../const";
import { useFetchPanelElements } from "./useFetchPanelElements";

/**
 * Custom hook for dispatching workspace related actions
 **/
const useWorkspaceState = () => {
  const dispatch = useDispatch();

  const workspaceVisited = useSelector(
    (state) => state.workspace.workspaceVisited
  );
  const curCategory = useSelector((state) => state.workspace.curCategory);
  const modelVersion = useSelector((state) => state.workspace.modelVersion);
  const uploadedLabels = useSelector((state) => state.workspace.uploadedLabels);
  const activePanelId = useSelector((state) => state.workspace.panels.activePanelId);

  const { fetchPanelElements, updateActivePanelElements } =
    useFetchPanelElements();

  React.useEffect(() => {
    if (!workspaceVisited) {
      dispatch(setWorkspaceVisited());
    }
  }, [workspaceVisited, dispatch]);

  React.useEffect(() => {
    // fetch documents only once, they won't change
    dispatch(fetchDocuments());

    // fetch categories only once, they will be fetched again if a new category is added
    dispatch(fetchCategories());
  }, []);

  React.useEffect(() => {
    // update the model version when the category changes (if any)
    if (curCategory !== null) {
      dispatch(checkModelUpdate());
      dispatch(cleanEvaluationState());
    }
  }, [curCategory, dispatch]);

  React.useEffect(() => {
    // category changes or modelVersion changes means
    // that recommend to label and active panel has to be updated
    // also the status is updated
    if (curCategory !== null) {
      dispatch(checkStatus());
      // checking for nullity first because in js null >= 0
      if (modelVersion !== null && modelVersion >= 0) {
        // always fetch label next elements
        fetchPanelElements({panelId: panelIds.LABEL_NEXT})
        if (activePanelId !== panelIds.LABEL_NEXT) {
          updateActivePanelElements();
        }
      }
    }
  }, [curCategory, modelVersion, dispatch]);

  React.useEffect(() => {
    // this useEffect manages the actions to be carried out when new labels have been imported
    // if new categories where added the category list is fetched again
    // if the user is currently in a category where labels have been added then the document is
    // fetched again, as well as the search bar results (in case element labels has to be updated there)
    if (uploadedLabels) {
      const { categories, categoriesCreated } = uploadedLabels;
      if (categories?.some((cat) => cat.category_id == curCategory)) {
        fetchPanelElements({
          panelId: panelIds.POSITIVE_LABELS,
        });
        fetchPanelElements({
          panelId: panelIds.MAIN_PANEL,
        }).then(() => {
          dispatch(checkStatus());
        });
      }
      if (categoriesCreated) {
        dispatch(fetchCategories());
      }
      dispatch(cleanUploadedLabels());
    }
  }, [uploadedLabels, curCategory, dispatch]);
};

export default useWorkspaceState;
