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
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import CreateCategoryModal from './upperbar/Modal';
import { ToastContainer } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import {
  setSearchInput,
  resetSearchResults,
} from './DataSlice.jsx';
import WorkspaceInfo from './information/WorkspaceInfo';
import UpperBar from './upperbar/UpperBar';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { IconButton, Tooltip } from '@mui/material';
import classes from './sidebar/index.module.css';
import search_icon from './Asset/search.svg';
import recommend_icon from './Asset/query-queue.svg'
import pos_pred_icon from './Asset/pos_predictions.svg'
import { SEARCH_ALL_DOCS_TOOLTIP_MSG, NEXT_TO_LABEL_TOOLTIP_MSG,  getPosPredTooltipMessage,  SEARCH, RCMD, POS_PREDICTIONS } from '../../const'
import useTogglePanel from "./sidebar/customHooks/useTogglePanel";
import Drawer from '@mui/material/Drawer';
import { PanelManager } from "./PanelManager";
import SearchPanel from "./sidebar/SearchPanel";
import RecToLabelPanel from "./sidebar/RecToLabelPanel";
import useWorkspaceState from './useWorkspaceState';
import Tutorial from './tutorial';
import PosPredictionsPanel from "./sidebar/PosPredictionsPanel";
import TutorialDialog from "./tutorial/TutorialDialog";
import useBackdrop from "../../customHooks/useBackdrop";

export default function Workspace() {
  const workspaceId = JSON.parse(window.localStorage.getItem('workspaceId'))
  const [open, setOpen] = useState(false);
  const curCategory = useSelector(state => state.workspace.curCategory)
  const activePanel = useSelector(state => state.workspace.activePanel)
  const model_version = useSelector(state => state.workspace.model_version)
  const workspaceVisited = useSelector(state => state.workspace.workspaceVisited)
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialDialogOpen, setTutorialDialogOpen] = useState(!!!workspaceVisited);
  const [modalOpen, setModalOpen] = useState(false)
  const textInput = useRef(null);
  const {openBackdrop}  = useBackdrop()

  const { 
    activateSearchPanel, 
    activateRecToLabelPanel, 
    activatePosPredLabelPanel,
    toggleSearchPanel, 
    toggleRCMDPanel, 
    togglePosPredPanel 
  } = 
  useTogglePanel(setOpen, textInput)

  const dispatch = useDispatch();
  useWorkspaceState()

  const clearSearchInput = () => {
    dispatch(setSearchInput(""))

    dispatch(resetSearchResults())
    if (textInput.current) {
      textInput.current.value = ""
      textInput.current.focus()
    }
  }

  useEffect(() => {
    clearSearchInput()
  }, [curCategory])

  return (
    <>
      <Box sx={{ display: 'flex' }} style={tutorialOpen ? {filter: "blur(2px)"} : null}>
        <CssBaseline />
        <ToastContainer position="top-center" hideProgressBar={true} autoClose={7000} theme='dark' />
        <WorkspaceInfo workspaceId={workspaceId} setTutorialOpen={setTutorialOpen}/>
        <Box component="main" sx={{ padding: 0 }}>
          <UpperBar setModalOpen={setModalOpen} open={open} />
          <PanelManager
            open={open}
            activePanel={activePanel}>
            {open && activePanel == SEARCH && <SearchPanel ref={textInput} clearSearchInput={clearSearchInput} />}
            {activePanel == RCMD && <RecToLabelPanel />}
            {activePanel == POS_PREDICTIONS && <PosPredictionsPanel />}  
          </PanelManager>
          {/* Panel tabs  */}
          <Drawer variant="permanent" anchor="right" PaperProps={{ sx: { minWidth: 50, } }}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: 'center', justifyContent: 'space-between', margin: '5px' }}>
              <Tooltip title={SEARCH_ALL_DOCS_TOOLTIP_MSG} placement="left">
                <IconButton className={classes.top_nav_icons} onClick={activateSearchPanel} id='sidebar-search-button'>
                  <img src={search_icon} style={{ filter: !toggleSearchPanel ? 'invert(45%)' : "" }} alt="search" />
                </IconButton>
              </Tooltip>
              <Tooltip title={NEXT_TO_LABEL_TOOLTIP_MSG} placement="left">
                <IconButton
                  disabled={!model_version || model_version === -1}
                  className={!model_version || model_version === -1 ? classes.btndisabled : classes.top_nav_icons}
                  onClick={activateRecToLabelPanel}
                  id='sidebar-recommended-button'
                >
                  <img src={recommend_icon} style={{ filter: !toggleRCMDPanel ? 'invert(45%)' : "" }} alt="recommendation" />
                </IconButton>
              </Tooltip>
              <Tooltip   title={getPosPredTooltipMessage(curCategory)} placement="left">
                <IconButton
                  disabled={!model_version || model_version === -1}
                  className={!model_version || model_version === -1 ? classes.btndisabled : classes.pos_pred_icon}
                  onClick={activatePosPredLabelPanel}
                  id='sidebar-pos-pred-button'
                >
                  <img src={pos_pred_icon} width= "22px" height= "22px"  style={{ filter: !togglePosPredPanel ? 'invert(45%)' : "" }} alt="positive predictions" />
                </IconButton>
              </Tooltip>
            </Box>
          </Drawer>
        </Box>
        <CreateCategoryModal open={modalOpen} setOpen={setModalOpen} />
        <Tutorial tutorialOpen={tutorialOpen} setTutorialOpen={setTutorialOpen}/>
        <TutorialDialog open={tutorialDialogOpen} setOpen={setTutorialDialogOpen} setTutorialOpen={setTutorialOpen}/>
       </Box>
      <Backdrop
        sx={{ color: '#fff', zIndex: 10000 }}
        open={openBackdrop}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}

