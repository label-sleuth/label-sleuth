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

import { useRef } from "react";
import { Box } from "@mui/material";
import Drawer from "@mui/material/Drawer";
import {
  RIGHT_DRAWER_INITIAL_WIDTH,
  ACTIONS_DRAWER_WIDTH,
  PanelIdsEnum,
} from "../../const";
import MainPanel from "./main/MainPanel";
import { useAppSelector } from "../../customHooks/useRedux";
import { UserLabelsPanel } from "./sidebar/UserLabelsPanel";
import SuspiciousLabelsPanel from "./sidebar/SuspiciousLabelsPanel";
import ContradictingLabelsPanel from "./sidebar/ContradictingLabelsPanel";
import EvaluationPanel from "./sidebar/EvaluationPanel";
import SearchPanel from "./sidebar/SearchPanel";
import LabelNextPanel from "./sidebar/LabelNextPanel";
import PosPredictionsPanel from "./sidebar/PosPredictionsPanel";

import useTogglePanel from "../../customHooks/useTogglePanel";
import useResize from "../../customHooks/useResize";
import { useUpdateSearch } from "../../customHooks/useUpdateSearch";
import { useFocusSidebarElement } from "../../customHooks/useFocusSidebarElement";

interface ResizableDivProps {
  onMouseDown: (e: React.MouseEvent) => void;
  rightDrawerWidth: number;
}

const ResizableDiv = ({ onMouseDown, rightDrawerWidth }: ResizableDivProps) => {
  return (
    <div
      style={{
        width: "4px",
        cursor: "ew-resize",
        position: "absolute",
        top: 0,
        bottom: 0,
        right: rightDrawerWidth + ACTIONS_DRAWER_WIDTH - 2,
        backgroundColor: "transparent",
      }}
      onMouseDown={onMouseDown}
    />
  );
};

interface PanelManagerProps {
  rightDrawerWidth: number;
  setRightDrawerWidth: React.Dispatch<React.SetStateAction<number>>;
  rightPanelOpen: boolean;
  setRightPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Manages the panels, that is, the sidebar panels and the main panels.
 */
export const PanelManager = ({
  rightDrawerWidth,
  setRightDrawerWidth,
  rightPanelOpen,
  setRightPanelOpen,
}: PanelManagerProps) => {
  const activePanelId = useAppSelector(
    (state) => state.workspace.panels.activePanelId
  );

  const textInputRef = useRef<HTMLInputElement | null>(null);

  useTogglePanel(setRightPanelOpen, textInputRef);

  useFocusSidebarElement();

  /**
   * this custom hook is used here instead of in the Search sidebar panel
   * because that panel gets unmounted when another sidebar panel gets selected
   * and that makes useEffects hooks to be re-run each time it gets re-rendered
   */
  const clearSearchInput = useUpdateSearch(textInputRef);

  const { handleMouseDown } = useResize({ setWidth: setRightDrawerWidth });

  return (
    <Box>
      <MainPanel rightDrawerWidth={rightDrawerWidth} open={rightPanelOpen} />
      {rightPanelOpen && (
        <ResizableDiv
          onMouseDown={handleMouseDown}
          rightDrawerWidth={rightDrawerWidth}
        />
      )}
      <Drawer
        sx={{
          width: RIGHT_DRAWER_INITIAL_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: rightDrawerWidth,
            boxSizing: "border-box",
          },
        }}
        PaperProps={{
          sx: {
            backgroundColor: "#f8f9fa !important",
            right: ACTIONS_DRAWER_WIDTH,
          },
        }}
        variant="persistent"
        anchor="right"
        open={rightPanelOpen}
      >
        {activePanelId === PanelIdsEnum.SEARCH && (
          <SearchPanel clearSearchInput={clearSearchInput} ref={textInputRef} />
        )}
        {activePanelId === PanelIdsEnum.LABEL_NEXT && <LabelNextPanel />}
        {activePanelId === PanelIdsEnum.POSITIVE_PREDICTIONS && (
          <PosPredictionsPanel />
        )}
        {activePanelId === PanelIdsEnum.POSITIVE_LABELS && <UserLabelsPanel />}
        {activePanelId === PanelIdsEnum.SUSPICIOUS_LABELS && (
          <SuspiciousLabelsPanel />
        )}
        {activePanelId === PanelIdsEnum.CONTRADICTING_LABELS && (
          <ContradictingLabelsPanel />
        )}
        {activePanelId === PanelIdsEnum.EVALUATION && <EvaluationPanel />}
      </Drawer>
    </Box>
  );
};
