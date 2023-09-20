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

import { useState, useMemo, useRef } from "react";
import Box from "@mui/material/Box";
import { Stack } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { setActivePanel } from "./redux";
import { WorkspaceInfo } from "./information";
import { UpperBar } from "./upperbar";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import { IconButton, Tooltip } from "@mui/material";
import classes from "./sidebar/index.module.css";
import search_icon from "../../assets/search.svg";
import recommend_icon from "../../assets/label_next.svg";
import pos_pred_icon from "../../assets/positive_predictions.svg";
import pos_elem_icon from "../../assets/positive_labels.svg";
import suspicious_elem_icon from "../../assets/suspicious.svg";
import evaluation_icon from "../../assets/evaluation.svg";
import contradictive_elem_icon from "../../assets/contradicting.svg";
import {
  SEARCH_ALL_DOCS_TOOLTIP_MSG,
  NEXT_TO_LABEL_TOOLTIP_MSG,
  USER_LABELS_TOOLTIP_MSG,
  SUSPICIOUS_LABELS_TOOLTIP_MSG,
  CONTRADICTING_LABELS_TOOLTIP_MSG,
  POSITIVE_PRED_TOOLTIP_MSG,
  EVALUATION_TOOLTIP_MSG,
  PanelIdsEnum,
  RIGHT_DRAWER_INITIAL_WIDTH,
  WorkspaceMode,
} from "../../const";
import { ShortcutsModal } from "./main/ShortcutsModal";
import Drawer from "@mui/material/Drawer";
import { PanelManager } from "./PanelManager";
import Tutorial from "./tutorial";
import { TutorialDialog } from "./tutorial/TutorialDialog";

import useBackdrop from "../../customHooks/useBackdrop";
import useWorkspaceState from "../../customHooks/useWorkspaceState";
import { useSidebarLabelingShortcuts } from "../../customHooks/useShorcuts";
import { useWorkspaceVisited } from "../../customHooks/useWorkspaceVisited";
import { usePreloadDataset } from "../../customHooks/usePreloadDataset";
import { useAppDispatch, useAppSelector } from "../../customHooks/useRedux";
import { useNotifyNewModelTraining } from "../../customHooks/useNotifyNewModelTraining";

export const Workplace = () => {
  const curCategory = useAppSelector((state) => state.workspace.curCategory);
  const activePanelId = useAppSelector(
    (state) => state.workspace.panels.activePanelId
  );
  const modelVersion = useAppSelector((state) => state.workspace.modelVersion);
  const mode = useAppSelector((state) => state.workspace.mode);

  const isMulticlass = useMemo(() => {
    return mode === WorkspaceMode.MULTICLASS;
  }, [mode]);

  const evaluationIsInProgress = useAppSelector(
    (state) =>
      state.workspace.panels.panels[PanelIdsEnum.EVALUATION].isInProgress
  );
  const evaluationLoading = useAppSelector(
    (state) => state.workspace.panels.loading[PanelIdsEnum.EVALUATION]
  );
  const categories = useAppSelector((state) => state.workspace.categories);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const workspaceVisited = useWorkspaceVisited();

  const [tutorialDialogOpen, setTutorialDialogOpen] = useState(
    !!!workspaceVisited
  );
  const [rightDrawerWidth, setRightDrawerWidth] = useState(
    RIGHT_DRAWER_INITIAL_WIDTH
  );
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  const workspaceRef = useRef();
  const dispatch = useAppDispatch();

  // call custom hooks
  const { backdropOpen } = useBackdrop();
  useSidebarLabelingShortcuts({ setShortcutsModalOpen });
  usePreloadDataset();
  useWorkspaceState();
  useNotifyNewModelTraining();

  const noCategory = useMemo(() => curCategory === null, [curCategory]);

  const noCategoryAndNoModel = useMemo(
    () => noCategory || modelVersion === null || modelVersion === -1,
    [noCategory, modelVersion]
  );

  const noModel = useMemo(
    () => modelVersion === null || modelVersion === -1,
    [modelVersion]
  );

  interface SidebarButtonProps {
    tooltipMessage: string;
    componentId: string;
    imgSource: string;
    disabled: boolean;
    panelId: PanelIdsEnum;
  }

  const SidebarButton = ({
    tooltipMessage,
    componentId,
    imgSource,
    disabled,
    panelId,
  }: SidebarButtonProps) => {
    const isSelected = activePanelId === panelId;
    const onClick = () =>
      dispatch(
        setActivePanel(
          panelId === activePanelId ? PanelIdsEnum.NOT_SET : panelId
        )
      );

    const Button = () => (
      <div>
        <IconButton
          disabled={disabled}
          className={disabled ? classes.btndisabled : classes.top_nav_icons}
          onClick={onClick}
          id={componentId}
        >
          <img
            src={imgSource}
            className={
              isSelected ? classes["blue-filter"] : classes["gray-filter"]
            }
            alt={componentId}
          />
        </IconButton>
      </div>
    );

    return (
      <Tooltip title={tooltipMessage} placement="left">
        <span>
          <Button />
        </span>
      </Tooltip>
    );
  };

  return (
    <>
      <Box
        sx={{ display: "flex" }}
        style={tutorialOpen ? { filter: "blur(2px)" } : {}}
        ref={workspaceRef}
      >
        <CssBaseline />
        <WorkspaceInfo setTutorialOpen={setTutorialOpen} />
        <Box component="main" sx={{ padding: 0 }}>
          <UpperBar
            rightDrawerWidth={rightDrawerWidth}
            rightPanelOpen={rightPanelOpen}
          />
          <PanelManager
            rightDrawerWidth={rightDrawerWidth}
            setRightDrawerWidth={setRightDrawerWidth}
            rightPanelOpen={rightPanelOpen}
            setRightPanelOpen={setRightPanelOpen}
          />
          {/* Panel tabs  */}
          <Drawer
            variant="permanent"
            anchor="right"
            PaperProps={{ sx: { minWidth: 50 } }}
          >
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
                  panelId={PanelIdsEnum.SEARCH}
                />
                <SidebarButton
                  tooltipMessage={NEXT_TO_LABEL_TOOLTIP_MSG}
                  componentId={"sidebar-recommended-button"}
                  imgSource={recommend_icon}
                  disabled={
                    evaluationIsInProgress ||
                    evaluationLoading ||
                    (!isMulticlass && noCategoryAndNoModel) ||
                    (isMulticlass && noModel)
                  }
                  panelId={PanelIdsEnum.LABEL_NEXT}
                />
                <SidebarButton
                  tooltipMessage={POSITIVE_PRED_TOOLTIP_MSG}
                  componentId={"sidebar-pos-pred-button"}
                  imgSource={pos_pred_icon}
                  disabled={
                    evaluationIsInProgress ||
                    evaluationLoading ||
                    (!isMulticlass && noCategoryAndNoModel) ||
                    (isMulticlass && noModel)
                  }
                  panelId={PanelIdsEnum.POSITIVE_PREDICTIONS}
                />
              </Stack>
              <Stack>
                <SidebarButton
                  tooltipMessage={USER_LABELS_TOOLTIP_MSG}
                  componentId={"sidebar-pos-elem-button"}
                  imgSource={pos_elem_icon}
                  disabled={
                    evaluationIsInProgress ||
                    evaluationLoading ||
                    (!isMulticlass && noCategory) ||
                    (isMulticlass && categories.length === 0)
                  }
                  panelId={PanelIdsEnum.POSITIVE_LABELS}
                />
                <SidebarButton
                  tooltipMessage={SUSPICIOUS_LABELS_TOOLTIP_MSG}
                  componentId={"sidebar-suspicious-elem-button"}
                  imgSource={suspicious_elem_icon}
                  disabled={
                    evaluationIsInProgress ||
                    evaluationLoading ||
                    (!isMulticlass && noCategoryAndNoModel) ||
                    isMulticlass
                  }
                  panelId={PanelIdsEnum.SUSPICIOUS_LABELS}
                />
                <SidebarButton
                  tooltipMessage={CONTRADICTING_LABELS_TOOLTIP_MSG}
                  componentId={"sidebar-contradictive-elem-button"}
                  imgSource={contradictive_elem_icon}
                  disabled={
                    evaluationIsInProgress ||
                    evaluationLoading ||
                    (!isMulticlass && noCategory) ||
                    isMulticlass
                  }
                  panelId={PanelIdsEnum.CONTRADICTING_LABELS}
                />
                <SidebarButton
                  tooltipMessage={EVALUATION_TOOLTIP_MSG}
                  componentId={"sidebar-contradictive-elem-button"}
                  imgSource={evaluation_icon}
                  disabled={
                    evaluationIsInProgress ||
                    evaluationLoading ||
                    (!isMulticlass && noCategoryAndNoModel) ||
                    (isMulticlass && noModel)
                  }
                  panelId={PanelIdsEnum.EVALUATION}
                />
              </Stack>
            </Stack>
          </Drawer>
        </Box>
        <Tutorial
          tutorialOpen={tutorialOpen}
          setTutorialOpen={setTutorialOpen}
        />
        <TutorialDialog
          open={tutorialDialogOpen}
          setOpen={setTutorialDialogOpen}
          setTutorialOpen={setTutorialOpen}
        />
        <ShortcutsModal
          open={shortcutsModalOpen}
          setOpen={setShortcutsModalOpen}
        />
      </Box>
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: backdropOpen ? 10000 : -1,
          display: backdropOpen ? "flex" : "none",
        }}
        open={backdropOpen}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
};
