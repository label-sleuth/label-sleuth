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
  cleanEvaluationState,
  cleanUploadedLabels,
  clearMainPanelFocusedElement,
  resetModelStatusCheckAttempts,
} from "../modules/Workplace/redux";
import * as React from "react";
import { useAppDispatch, useAppSelector } from "./useRedux";

import { PanelIdsEnum } from "../const";
import { useFetchPanelElements } from "./useFetchPanelElements";

/**
 * Custom hook for dispatching workspace related actions
 **/
const useWorkspaceState = () => {
  const dispatch = useAppDispatch();

  const curCategory = useAppSelector((state) => state.workspace.curCategory);
  const modelVersion = useAppSelector((state) => state.workspace.modelVersion);
  const uploadedLabels = useAppSelector((state) => state.workspace.uploadedLabels);


  const fetchMainPanelElements = useFetchPanelElements({ panelId: PanelIdsEnum.MAIN_PANEL });
  const fetchPositiveLabelsElements = useFetchPanelElements({ panelId: PanelIdsEnum.POSITIVE_LABELS });

  React.useEffect(() => {
    // fetch documents only once, they won't change
    dispatch(fetchDocuments());

    // fetch categories only once, they will be fetched again if a new category is added
    dispatch(fetchCategories());
  }, [dispatch]);

  React.useEffect(() => {
    // update the model version when the category changes (if any)
    if (curCategory !== null) {
      dispatch(checkModelUpdate());
      dispatch(cleanEvaluationState());
      dispatch(clearMainPanelFocusedElement());
      dispatch(resetModelStatusCheckAttempts())
    }
  }, [curCategory, dispatch]);

  React.useEffect(() => {
    // category changes or modelVersion changes means
    // run only if category is not null and the model version has been set
    // also the status is updated
    if (curCategory !== null && modelVersion !== null) {
      dispatch(checkStatus());
    }
  }, [curCategory, modelVersion, dispatch]);

  React.useEffect(() => {
    // this useEffect manages the actions to be carried out when new labels have been imported
    // if new categories where added the category list is fetched again
    // if the user is currently in a category where labels have been added then the document is
    // fetched again, as well as the search bar results (in case element labels has to be updated there)
    if (uploadedLabels) {
      const { categories, categoriesCreated } = uploadedLabels;
      if (categories?.some((cat) => cat.category_id === curCategory)) {
        fetchPositiveLabelsElements();
        fetchMainPanelElements();
        dispatch(checkStatus());
      }
      if (categoriesCreated) {
        dispatch(fetchCategories());
      }
      dispatch(cleanUploadedLabels());
    }
  }, [uploadedLabels, curCategory, fetchPositiveLabelsElements, fetchMainPanelElements, dispatch]);
};

export default useWorkspaceState;
