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
  fetchDocumentsMetadata,
  checkModelUpdate,
  cleanEvaluationState,
  cleanUploadedLabels,
  clearMainPanelFocusedElement,
  resetModelStatusCheckAttempts,
  changeMode,
  editCategory,
} from "../modules/Workplace/redux";
import * as React from "react";
import { useAppDispatch, useAppSelector } from "./useRedux";

import { PanelIdsEnum, WorkspaceMode } from "../const";
import {
  useFetchPanelElements,
  useUpdateActivePanelElements,
} from "./useFetchPanelElements";
import { getWorkspaces } from "../modules/Workspace-config/workspaceConfigSlice";
import { useWorkspaceId } from "./useWorkspaceId";
import { BadgeColor, Category, Workspace } from "../global";
import { getLeastUsedColors } from "../utils/utils";

/**
 * Custom hook for dispatching workspace related actions
 **/
const useWorkspaceState = () => {
  const dispatch = useAppDispatch();

  const curCategory = useAppSelector((state) => state.workspace.curCategory);
  const categories = useAppSelector((state) => state.workspace.categories);
  const modelVersion = useAppSelector((state) => state.workspace.modelVersion);
  const activePanelId = useAppSelector(
    (state) => state.workspace.panels.activePanelId
  );
  const panels = useAppSelector((state) => state.workspace.panels.panels);
  const uploadedLabels = useAppSelector(
    (state) => state.workspace.uploadedLabels
  );
  const mode = useAppSelector((state) => state.workspace.mode);

  const { updateActivePanelElements } = useUpdateActivePanelElements();

  const { workspaceId } = useWorkspaceId();

  const fetchMainPanelElements = useFetchPanelElements({
    panelId: PanelIdsEnum.MAIN_PANEL,
  });
  const fetchPositiveLabelsElements = useFetchPanelElements({
    panelId: PanelIdsEnum.USER_LABELS,
  });

  React.useEffect(() => {
    // fetch documents only once, they won't change
    dispatch(fetchDocumentsMetadata());
  }, [dispatch]);

  React.useEffect(() => {
    if (mode !== WorkspaceMode.NOT_SET) {
      // fetch categories only once, they will be fetched again if a new category is added
      dispatch(fetchCategories());
    }
  }, [dispatch, mode]);

  React.useEffect(() => {
    // update the model version when the category changes (if any)
    // reset the model status chech attemps count so when a category changes
    // we check several time whether there is a model
    // (possibly zero shot) is training
    if (mode === WorkspaceMode.BINARY && curCategory !== null) {
      dispatch(checkModelUpdate());
      dispatch(cleanEvaluationState());
      dispatch(clearMainPanelFocusedElement());
      dispatch(resetModelStatusCheckAttempts());
    }
  }, [mode, curCategory, dispatch]);

  React.useEffect(() => {
    // category changes or modelVersion changes means
    // run only if category is not null and the model version has been set
    // also the status is updated
    if (
      ((mode === WorkspaceMode.BINARY && curCategory !== null) ||
        mode === WorkspaceMode.MULTICLASS) &&
      modelVersion !== null
    ) {
      dispatch(checkStatus());
    }
  }, [mode, curCategory, modelVersion, dispatch]);

  React.useEffect(() => {
    if (mode === WorkspaceMode.NOT_SET) {
      dispatch(getWorkspaces()).then((action) => {
        const workspaceMode = action.payload.workspaces.find(
          (w: Workspace) => w.id === workspaceId
        )?.mode;
        workspaceMode && dispatch(changeMode(workspaceMode));
      });
    }

    if (mode === WorkspaceMode.MULTICLASS) {
      dispatch(checkStatus());
      dispatch(checkModelUpdate());
    }
  }, [mode, workspaceId, dispatch]);

  React.useEffect(() => {
    // this useEffect manages the actions to be carried on when new labels have been imported
    // if new categories where added the category list is fetched again
    // if the workspace is multiclass or if it is binary and the user is currently in a category where 
    // labels have been added then the document is fetched again, 
    // as well as the search bar results (in case element labels have to be updated there)
    if (uploadedLabels) {
      const { categories: categoriesStats, categoriesCreated } = uploadedLabels;
      // update elements and status only if the workspace is mc mode or if the current category was affected
      if (
        categoriesStats?.some((cat) => cat.category_id === curCategory) ||
        mode === WorkspaceMode.MULTICLASS
      ) {
        // we update the elements because the user labels changed!
        fetchMainPanelElements();
        if (
          [PanelIdsEnum.USER_LABELS, PanelIdsEnum.MODEL_PREDICTIONS].includes(
            activePanelId
          )
        ) {
          if (activePanelId === PanelIdsEnum.NOT_SET) return;
          updateActivePanelElements(
            panels[activePanelId].filters?.value || undefined
          );
        } else {
          updateActivePanelElements();
        }

        dispatch(checkStatus());
      }

      if (categoriesCreated) {
        if (mode === WorkspaceMode.BINARY) {
          dispatch(fetchCategories());
        } else if (mode === WorkspaceMode.MULTICLASS) {
          dispatch(fetchCategories()).then((a) => {
            // get only the categories that where added when uploading labels
            console.log(a.payload)
            const toUpdateCategories = (a.payload as Category[]).filter((c) =>
              categoriesCreated.includes(c.category_name)
            );

            let leastUsedColors: BadgeColor[] = [];
            toUpdateCategories.forEach((c, i) => {
              if (leastUsedColors.length === 0) {
                leastUsedColors = getLeastUsedColors(
                  categories
                    .map((c) => c.color?.name)
                    .filter((cn) => cn !== undefined) as string[]
                );
              }
              const chosenColor = leastUsedColors[0];
              leastUsedColors = leastUsedColors.slice(1);
              dispatch(
                editCategory({
                  newCategoryName: c.category_name,
                  newCategoryDescription: "",
                  newCategoryColor: chosenColor,
                  categoryId: c.category_id,
                })
              );
            });
          });
        }
      }

      dispatch(cleanUploadedLabels());
    }
  }, [
    categories,
    mode,
    uploadedLabels,
    curCategory,
    fetchPositiveLabelsElements,
    fetchMainPanelElements,
    activePanelId,
    panels,
    updateActivePanelElements,
    dispatch,
  ]);
};

export default useWorkspaceState;
