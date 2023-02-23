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

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { PanelIdsEnum } from "../const";
import { useAppSelector } from "./useRedux";
import { WORKSPACE_PATH, WORKSPACE_CONFIG_PATH } from "../config";

/**
 * Custom hooks that decides when the backdrop loading screen should be active
 */
const useBackdrop = (): { backdropOpen: boolean } => {
  const [backdropOpen, setBackdropOpen] = useState(false);
  const activePanelId = useAppSelector((state) => state.workspace.panels.activePanelId);
  const panelsLoading = useAppSelector((state) => state.workspace.panels.loading);
  const deletingCategory = useAppSelector((state) => state.workspace.deletingCategory);
  const uploadingLabels = useAppSelector((state) => state.workspace.uploadingLabels);
  const downloadingLabels = useAppSelector((state) => state.workspace.downloadingLabels);
  const downloadingModel = useAppSelector((state) => state.workspace.downloadingModel);
  const elements = useAppSelector((state) => state.workspace.panels.panels[PanelIdsEnum.MAIN_PANEL].elements);
  const uploadingDataset = useAppSelector((state) => state.workspaces.uploadingDataset);

  const location = useLocation();

  useEffect(() => {
    let shouldOpenBackdrop: boolean;
    if (location.pathname === WORKSPACE_PATH) {
      shouldOpenBackdrop =
        uploadingLabels ||
        downloadingLabels ||
        deletingCategory ||
        downloadingModel ||
        panelsLoading[PanelIdsEnum.MAIN_PANEL] ||
        elements === null
    } else if (location.pathname === WORKSPACE_CONFIG_PATH) {
      shouldOpenBackdrop = uploadingDataset;
    }
    else {
      shouldOpenBackdrop = false;
    }
    setBackdropOpen(shouldOpenBackdrop);
  }, [
    elements,
    location.pathname,
    uploadingDataset,
    panelsLoading,
    activePanelId,
    uploadingLabels,
    downloadingLabels,
    downloadingModel,
    deletingCategory,
  ]);

  return {
    backdropOpen,
  };
};

export default useBackdrop;
