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

import React, { useRef, useState, useEffect } from "react";
import Box from "@mui/material/Box";
import { Stack } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { ToastContainer } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import {
  setSearchInput,
  resetSearchResults,
  curCategoryNameSelector,
} from "./DataSlice.jsx";
import WorkspaceInfo from "./information/WorkspaceInfo";
import UpperBar from "./upperbar/UpperBar";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import { IconButton, Tooltip } from "@mui/material";
import classes from "./sidebar/index.module.css";
import search_icon from "./Asset/search.svg";
import recommend_icon from "./Asset/label_next.svg";
import pos_pred_icon from "./Asset/positive_predictions.svg";
import pos_elem_icon from "./Asset/positive_labels.svg";
import disagree_elem_icon from "./Asset/disagreement.svg";
import suspicious_elem_icon from "./Asset/suspicious.svg";
import contradictive_elem_icon from "./Asset/contradicting.svg";
import {
  SEARCH_ALL_DOCS_TOOLTIP_MSG,
  NEXT_TO_LABEL_TOOLTIP_MSG,
  ALL_POSITIVE_LABELS_TOOLTIP_MSG,
  DISAGREEMENTS_TOOLTIP_MSG,
  SUSPICIOUS_LABELS_TOOLTIP_MSG,
  CONTRADICTING_LABELS_TOOLTIP_MSG,
  POSITIVE_PRED_TOOLTIP_MSG,
  sidebarOptionEnum
} from "../../const";
import useTogglePanel from "./sidebar/customHooks/useTogglePanel";
import Drawer from "@mui/material/Drawer";
import { PanelManager } from "./PanelManager";
import SearchPanel from "./sidebar/SearchPanel";
import LabelNextPanel from "./sidebar/LabelNextPanel";
import useWorkspaceState from "./useWorkspaceState";
import Tutorial from "./tutorial";
import PosPredictionsPanel from "./sidebar/PosPredictionsPanel";
import TutorialDialog from "./tutorial/TutorialDialog";
import useBackdrop from "../../customHooks/useBackdrop";
import { useErrorHandler } from "./useErrorHandler";

import AllPositiveLabelsPanel from "./sidebar/AllPositiveLabelsPanel";
import DisagreementsPanel from "./sidebar/DisagreementsPanel";
import SuspiciousLabelsPanel from "./sidebar/SuspiciousLabelsPanel";
import ContradictingLabelsPanel from "./sidebar/ContradictingLabelsPanel";

export default function Workspace() {
  const workspaceId = JSON.parse(window.localStorage.getItem("workspaceId"));
  const [open, setOpen] = useState(false);
  const curCategory = useSelector((state) => state.workspace.curCategory);
  const curCategoryName = useSelector(curCategoryNameSelector);
  const activePanel = useSelector((state) => state.workspace.activePanel);
  const model_version = useSelector((state) => state.workspace.model_version);
  const workspaceVisited = useSelector(
    (state) => state.workspace.workspaceVisited
  );
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialDialogOpen, setTutorialDialogOpen] = useState(
    !!!workspaceVisited
  );

  const textInput = useRef(null);
  const { openBackdrop } = useBackdrop();

  const {
    activateSearchPanel,
    activateRecToLabelPanel,
    activatePosPredLabelPanel,
    activatePosElemLabelPanel,
    activateDisagreeElemLabelPanel,
    activateSuspiciousElemLabelPanel,
    activateContrElemLabelPanel,
    toggleSearchPanel,
    toggleRCMDPanel,
    togglePosPredPanel,
    togglePosElemPanel,
    toggleDisagreeElemPanel,
    toggleSuspiciousElemPanel,
    toggleContrElemPanel,
  } = useTogglePanel(setOpen, textInput);

  const dispatch = useDispatch();

  useWorkspaceState();
  useErrorHandler();

  const clearSearchInput = () => {
    dispatch(setSearchInput(""));

    dispatch(resetSearchResults());
    if (textInput.current) {
      textInput.current.value = "";
      textInput.current.focus();
    }
  };

  useEffect(() => {
    clearSearchInput();
  }, [curCategory]);

  const shouldDisableButtons =
    curCategory === null || !model_version || model_version === -1;

  const SidebarButton = ({ tooltipMessage, onClick, componentId, imgSource, isSelected, alwaysEnabled }) => {
    const disabled = !alwaysEnabled && shouldDisableButtons
    return (
      <Tooltip title={tooltipMessage} placement="left">
        <IconButton
          disabled={disabled}
          className={
            disabled ? classes.btndisabled : classes.top_nav_icons
          }
          onClick={onClick}
          id={componentId}
        >
          <img
            src={imgSource}
            className={isSelected ? classes['blue-filter'] : classes['gray-filter']}
            alt={componentId}
          />
        </IconButton>
      </Tooltip>
    );
  };

  return (
    <>
      <Box
        sx={{ display: "flex" }}
        style={tutorialOpen ? { filter: "blur(2px)" } : null}
      >
        <CssBaseline />
        <ToastContainer
          position="top-center"
          hideProgressBar={true}
          autoClose={7000}
          theme="dark"
        />
        <WorkspaceInfo
          workspaceId={workspaceId}
          setTutorialOpen={setTutorialOpen}
        />
        <Box component="main" sx={{ padding: 0 }}>
          <UpperBar />
          <PanelManager open={open}>
            {open && activePanel === sidebarOptionEnum.SEARCH && (
              <SearchPanel
                ref={textInput}
                clearSearchInput={clearSearchInput}
              />
            )}
            {activePanel === sidebarOptionEnum.LABEL_NEXT && <LabelNextPanel />}
            {activePanel === sidebarOptionEnum.POSITIVE_PREDICTIONS && <PosPredictionsPanel />}
            {activePanel === sidebarOptionEnum.POSITIVE_LABELS && <AllPositiveLabelsPanel />}
            {activePanel === sidebarOptionEnum.DISAGREEMENTS && <DisagreementsPanel />}
            {activePanel === sidebarOptionEnum.SUSPICIOUS_LABELS && <SuspiciousLabelsPanel />}
            {activePanel === sidebarOptionEnum.CONTRADICTING_LABELS && (<ContradictingLabelsPanel />)}
          </PanelManager>
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
                flexGrow: 1 // makes this stack to fill all available space
              }}
            >
              <Stack>
                <SidebarButton
                  tooltipMessage={SEARCH_ALL_DOCS_TOOLTIP_MSG}
                  onClick={activateSearchPanel}
                  componentId={"sidebar-search-button"}
                  imgSource={search_icon}
                  isSelected={toggleSearchPanel}
                  alwaysEnabled
                />
                <SidebarButton
                  tooltipMessage={NEXT_TO_LABEL_TOOLTIP_MSG}
                  onClick={activateRecToLabelPanel}
                  componentId={"sidebar-recommended-button"}
                  imgSource={recommend_icon}
                  isSelected={toggleRCMDPanel}
                />
                <SidebarButton
                  tooltipMessage={POSITIVE_PRED_TOOLTIP_MSG}
                  onClick={activatePosPredLabelPanel}
                  componentId={"sidebar-pos-pred-button"}
                  imgSource={pos_pred_icon}
                  isSelected={togglePosPredPanel}
                  />
              </Stack>

              <Stack>
                <SidebarButton
                  tooltipMessage={ALL_POSITIVE_LABELS_TOOLTIP_MSG}
                  onClick={activatePosElemLabelPanel}
                  componentId={"sidebar-pos-elem-button"}
                  imgSource={pos_elem_icon}
                  isSelected={togglePosElemPanel}
                  alwaysEnabled={false}
                />
                <SidebarButton
                  tooltipMessage={DISAGREEMENTS_TOOLTIP_MSG}
                  onClick={activateDisagreeElemLabelPanel}
                  componentId={"sidebar-disagree-elem-button"}
                  imgSource={disagree_elem_icon}
                  isSelected={toggleDisagreeElemPanel}
                />
                <SidebarButton
                  tooltipMessage={SUSPICIOUS_LABELS_TOOLTIP_MSG}
                  onClick={activateSuspiciousElemLabelPanel}
                  componentId={"sidebar-suspicious-elem-button"}
                  imgSource={suspicious_elem_icon}
                  isSelected={toggleSuspiciousElemPanel}
                />
                <SidebarButton
                  tooltipMessage={CONTRADICTING_LABELS_TOOLTIP_MSG}
                  onClick={activateContrElemLabelPanel}
                  componentId={'sidebar-contradictive-elem-button'}
                  imgSource={contradictive_elem_icon}
                  isSelected={toggleContrElemPanel}
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
      </Box>
      <Backdrop sx={{ color: "#fff", zIndex: 10000 }} open={openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}
