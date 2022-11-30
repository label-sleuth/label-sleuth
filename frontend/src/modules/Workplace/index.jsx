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

import React, { useState, useMemo, useRef } from "react";
import Box from "@mui/material/Box";
import { Stack } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { useDispatch, useSelector } from "react-redux";
import { setActivePanel } from "./redux/DataSlice";
import { WorkspaceInfo } from "./information";
import UpperBar from "./upperbar/UpperBar";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import { IconButton, Tooltip } from "@mui/material";
import classes from "./sidebar/index.module.css";
import search_icon from "./Asset/search.svg";
import recommend_icon from "./Asset/label_next.svg";
import pos_pred_icon from "./Asset/positive_predictions.svg";
import pos_elem_icon from "./Asset/positive_labels.svg";
import suspicious_elem_icon from "./Asset/suspicious.svg";
import evaluation_icon from "./Asset/evaluation.svg";
import contradictive_elem_icon from "./Asset/contradicting.svg";
import {
  SEARCH_ALL_DOCS_TOOLTIP_MSG,
  NEXT_TO_LABEL_TOOLTIP_MSG,
  ALL_POSITIVE_LABELS_TOOLTIP_MSG,
  SUSPICIOUS_LABELS_TOOLTIP_MSG,
  CONTRADICTING_LABELS_TOOLTIP_MSG,
  POSITIVE_PRED_TOOLTIP_MSG,
  EVALUATION_TOOLTIP_MSG,
  panelIds,
} from "../../const";
import { ShortcutsModal } from "./main/ShortcutsModal";

import Drawer from "@mui/material/Drawer";
import { PanelManager } from "./PanelManager";

import useWorkspaceState from "./customHooks/useWorkspaceState";
import Tutorial from "./tutorial";
import TutorialDialog from "./tutorial/TutorialDialog";
import useBackdrop from "../../customHooks/useBackdrop";
import { useSidebarLabelingShortcuts } from "./customHooks/useSidebarLabelingShorcuts";
import { useWorkspaceVisited } from "./customHooks/useWorkspaceVisited";

export default function Workspace() {
  const workspaceId = JSON.parse(window.localStorage.getItem("workspaceId"));
  const curCategory = useSelector((state) => state.workspace.curCategory);
  const activePanelId = useSelector((state) => state.workspace.panels.activePanelId);
  const modelVersion = useSelector((state) => state.workspace.modelVersion);
  const evaluationIsInProgress = useSelector((state) => state.workspace.panels[panelIds.EVALUATION].isInProgress);
  const evaluationLoading = useSelector((state) => state.workspace.panels.loading[panelIds.EVALUATION]);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false)
  const workspaceVisited = useWorkspaceVisited()

  const [tutorialDialogOpen, setTutorialDialogOpen] = useState(!!!workspaceVisited);

  const workspaceRef = useRef();

  useSidebarLabelingShortcuts({setShortcutsModalOpen});

  const { openBackdrop } = useBackdrop();

  const dispatch = useDispatch();

  useWorkspaceState();

  const noCategory = useMemo(() => curCategory === null, [curCategory]);
  const noCategoryAndNoModel = useMemo(
    () => noCategory || modelVersion === null || modelVersion === -1,
    [noCategory, modelVersion]
  );

  const SidebarButton = ({ tooltipMessage, componentId, imgSource, disabled, panelId }) => {
    const isSelected = activePanelId === panelId;
    const onClick = () => dispatch(setActivePanel(panelId === activePanelId ? "" : panelId));

    const Button = React.forwardRef((props, ref) => (
      <div ref={ref} {...props}>
        <IconButton
          disabled={disabled}
          className={disabled ? classes.btndisabled : classes.top_nav_icons}
          onClick={onClick}
          id={componentId}
        >
          <img
            src={imgSource}
            className={isSelected ? classes["blue-filter"] : classes["gray-filter"]}
            alt={componentId}
          />
        </IconButton>
      </div>
    ));

    return disabled ? (
      <Button />
    ) : (
      <Tooltip title={tooltipMessage} placement="left">
        <Button />
      </Tooltip>
    );
  };

  return (
    <>
      <Box sx={{ display: "flex" }} style={tutorialOpen ? { filter: "blur(2px)" } : null} ref={workspaceRef}>
        <CssBaseline />
        <WorkspaceInfo workspaceId={workspaceId} setTutorialOpen={setTutorialOpen} />
        <Box component="main" sx={{ padding: 0 }}>
          <UpperBar />
          <PanelManager />
          {/* Panel tabs  */}
          <Drawer variant="permanent" anchor="right" PaperProps={{ sx: { minWidth: 50 } }}>
            <Stack
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                margin: "5px",
                flexGrow: 1, // makes this stack to fill all available space
              }}
            >
              <Stack>
                <SidebarButton
                  tooltipMessage={SEARCH_ALL_DOCS_TOOLTIP_MSG}
                  componentId={"sidebar-search-button"}
                  imgSource={search_icon}
                  disabled={evaluationIsInProgress || evaluationLoading}
                  panelId={panelIds.SEARCH}
                />
                <SidebarButton
                  tooltipMessage={NEXT_TO_LABEL_TOOLTIP_MSG}
                  componentId={"sidebar-recommended-button"}
                  imgSource={recommend_icon}
                  disabled={evaluationIsInProgress || evaluationLoading || noCategoryAndNoModel}
                  panelId={panelIds.LABEL_NEXT}
                />
                <SidebarButton
                  tooltipMessage={POSITIVE_PRED_TOOLTIP_MSG}
                  componentId={"sidebar-pos-pred-button"}
                  imgSource={pos_pred_icon}
                  disabled={evaluationIsInProgress || evaluationLoading || noCategoryAndNoModel}
                  panelId={panelIds.POSITIVE_PREDICTIONS}
                />
              </Stack>
              <Stack>
                <SidebarButton
                  tooltipMessage={ALL_POSITIVE_LABELS_TOOLTIP_MSG}
                  componentId={"sidebar-pos-elem-button"}
                  imgSource={pos_elem_icon}
                  alwaysEnabled
                  disabled={evaluationIsInProgress || evaluationLoading || noCategory}
                  panelId={panelIds.POSITIVE_LABELS}
                />
                <SidebarButton
                  tooltipMessage={SUSPICIOUS_LABELS_TOOLTIP_MSG}
                  componentId={"sidebar-suspicious-elem-button"}
                  imgSource={suspicious_elem_icon}
                  disabled={evaluationIsInProgress || evaluationLoading || noCategoryAndNoModel}
                  panelId={panelIds.SUSPICIOUS_LABELS}
                />
                <SidebarButton
                  tooltipMessage={CONTRADICTING_LABELS_TOOLTIP_MSG}
                  componentId={"sidebar-contradictive-elem-button"}
                  imgSource={contradictive_elem_icon}
                  disabled={evaluationIsInProgress || evaluationLoading || noCategory}
                  panelId={panelIds.CONTRADICTING_LABELS}
                />
                <SidebarButton
                  tooltipMessage={EVALUATION_TOOLTIP_MSG}
                  componentId={"sidebar-contradictive-elem-button"}
                  imgSource={evaluation_icon}
                  disabled={noCategoryAndNoModel}
                  panelId={panelIds.EVALUATION}
                />
              </Stack>
            </Stack>
          </Drawer>
        </Box>
        <Tutorial tutorialOpen={tutorialOpen} setTutorialOpen={setTutorialOpen} />
        <TutorialDialog open={tutorialDialogOpen} setOpen={setTutorialDialogOpen} setTutorialOpen={setTutorialOpen} />
        <ShortcutsModal open={shortcutsModalOpen} setOpen={setShortcutsModalOpen} />
      </Box>
      <Backdrop sx={{ color: "#fff", zIndex: 10000 }} open={openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}
