import { useRef, useState, useEffect } from "react";
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import CreateCategoryModal from './upperbar/Modal';
import { ToastContainer } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchElements,
  getElementToLabel,
  checkStatus,
  fetchCategories,
  checkModelUpdate,
  fetchDocuments,
  setFocusedState,
  setIsDocLoaded,
  setIsCategoryLoaded,
  setNumLabelGlobal,
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
import { SEARCH_ALL_DOCS_TOOLTIP_MSG, NEXT_TO_LABEL_TOOLTIP_MSG, SEARCH, RCMD, RIGHT_DRAWER_WIDTH } from '../../const'
import useTogglePanel from "./sidebar/customHooks/useTogglePanel";
import Drawer from '@mui/material/Drawer';
import { PanelManager } from "./PanelManager";
import useUpdateLabelState from "./sidebar/customHooks/useUpdateLabelState";
import SearchPanel from "./sidebar/SearchPanel";
import RecToLabelPanel from "./sidebar/RecToLabelPanel";

export default function Workspace() {
  const workspaceId = JSON.parse(window.localStorage.getItem('workspaceId'))
  const [open, setOpen] = useState(false);
  const workspace = useSelector(state => state.workspace)
  const [modalOpen, setModalOpen] = useState(false)
  const isCategoryLoaded = useSelector(state => state.workspace.isCategoryLoaded)
  const isDocLoaded = useSelector(state => state.workspace.isDocLoaded)
  const [openBackdrop, setOpenBackdrop] = useState(false);
  const { handleDrawerClose, activateSearchPanel, activateRecToLabelPanel } = useTogglePanel(setOpen)
  const activePanel = useSelector(state => state.workspace.activePanel)


  const handleKeyEvent = (event, len_elements) => {

    console.log("key pressed")
    if (event.key === "ArrowDown") {
      if (workspace.focusedIndex < len_elements) {
        dispatch(setFocusedState(workspace.focusedIndex + 1))
      }
    } else if (event.key === "ArrowUp") {
      if (workspace.focusedIndex > 0) {
        dispatch(setFocusedState(workspace.focusedIndex - 1))
      }
    }
  }


  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setIsCategoryLoaded(false));
    dispatch(setIsDocLoaded(false));
    dispatch(checkModelUpdate());
    dispatch(fetchDocuments()).then(() =>
      dispatch(fetchElements()).then(() =>
        dispatch(fetchCategories()).then(() => {
          if (workspace.curCategory) {
            dispatch(checkStatus());
            dispatch(getElementToLabel());
          }
          dispatch(setIsCategoryLoaded(true));
          dispatch(setIsDocLoaded(true));
        })
      )
    );

    const interval = setInterval(() => {
      console.log(`curCategory value: ${workspace.curCategory}`)
      if (workspace.curCategory != null) {
        dispatch(checkModelUpdate()).then(() => {
        })
      } else {

      }
    }, 5000);
    return () => clearInterval(interval);
  }, [workspace.curCategory])

  useEffect(() => {
    setNumLabelGlobal({ pos: workspace.pos_label_num, neg: workspace.neg_label_num })
  }, [workspace.pos_label_num])

  useEffect(() => {
    if (!workspace.curDocName || (!isCategoryLoaded) || !isDocLoaded) {
      setOpenBackdrop(!openBackdrop)
    }
    else {
      { setOpenBackdrop(false) }
    }

  }, [workspace.curDocName, isCategoryLoaded, !isDocLoaded])

  const textInput = useRef(null);


  const clearSearchInput = () => {
    dispatch(setSearchInput(""))

    dispatch(resetSearchResults())
    if (textInput.current) {
      textInput.current.value = ""
    }
  }

  useEffect(() => {
    if (isCategoryLoaded) {
      clearSearchInput()
    }
  }, [isCategoryLoaded])


  return (
    <>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <ToastContainer position="top-center" hideProgressBar={true} autoClose={7000} theme='dark' />
        <WorkspaceInfo workspaceId={workspaceId} />
        <Box component="main" sx={{ padding: 0 }}>
          <UpperBar setModalOpen={setModalOpen} open={open} />
          <PanelManager
            handleDrawerClose={handleDrawerClose}
            open={open}
            activePanel={activePanel}>
              {open && activePanel == SEARCH && 
              <SearchPanel ref={textInput} clearSearchInput={clearSearchInput} handleDrawerClose={handleDrawerClose} />}
              {activePanel == RCMD && 
              <RecToLabelPanel handleDrawerClose={handleDrawerClose} />}
          </PanelManager>
          {/* Panel tabs  */}
          <Drawer variant="permanent" anchor="right" PaperProps={{ sx: { minWidth: 50, } }}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: 'center', justifyContent: 'space-between', margin: '5px' }}>
              <Tooltip title={SEARCH_ALL_DOCS_TOOLTIP_MSG} placement="left">
                <IconButton className={classes.top_nav_icons} onClick={activateSearchPanel}>
                  <img src={search_icon} alt="search" />
                </IconButton>
              </Tooltip>
              <Tooltip title={NEXT_TO_LABEL_TOOLTIP_MSG} placement="left">
                <IconButton
                  disabled={!workspace.model_version || workspace.model_version === -1}
                  className={!workspace.model_version || workspace.model_version === -1 ? classes.btndisabled : classes.top_nav_icons}
                  onClick={activateRecToLabelPanel}>
                  <img src={recommend_icon} alt="recommendation" />
                </IconButton>
              </Tooltip>
            </Box>
          </Drawer>
        </Box>
        <CreateCategoryModal open={modalOpen} setOpen={setModalOpen} />
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

