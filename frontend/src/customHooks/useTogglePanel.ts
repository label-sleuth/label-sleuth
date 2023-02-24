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

import React, { useEffect } from "react";
import { PanelIdsEnum } from "../const";
import { setActivePanel } from "../modules/Workplace/redux";
import { useAppDispatch, useAppSelector } from "./useRedux";

/**
 * Opens the sidebar Drawer if any panel is selected
 * @param {*} setOpen
 */
const useSidebarPanelIsOpen = (setOpen: any) => {
  const activePanelId = useAppSelector((state) => state.workspace.panels.activePanelId);

  useEffect(() => {
    setOpen(!!activePanelId);
  }, [activePanelId, setOpen]);
};

/**
 * Decides which panel should be opened by default.
 * If there is a model and LabelNext elements are available
 * the LabelNext panel will be opened. If not, the search panel will
 * be opened.
 * @param {*} textInput
 */
const useInitialOpenedSidebarPanel = (textInput: React.MutableRefObject<HTMLElement | null>) => {
  const dispatch = useAppDispatch();

  const modelVersion = useAppSelector((state) => state.workspace.modelVersion);

  useEffect(() => {
    if (modelVersion === null || modelVersion === -1) {
      dispatch(setActivePanel(PanelIdsEnum.SEARCH));
      if (textInput.current) {
        textInput.current.focus();
      }
    } else {
      dispatch(setActivePanel(PanelIdsEnum.LABEL_NEXT));
    }
  }, [modelVersion, textInput, dispatch]);
};

/**
 * Manages the behaviour of the sidebar panels, when they should be opened and which one should be active.
 * @param {*} setOpen
 * @param {*} textInputRef
 */
const useTogglePanel = (
  setOpen: React.Dispatch<React.SetStateAction<boolean>>,
  textInputRef: React.MutableRefObject<HTMLElement | null>
) => {
  useSidebarPanelIsOpen(setOpen);
  useInitialOpenedSidebarPanel(textInputRef);
};

export default useTogglePanel;
