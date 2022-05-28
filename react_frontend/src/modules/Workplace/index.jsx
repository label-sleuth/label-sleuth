import * as React from 'react';
import { useCallback, useRef } from "react";
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import CreateCategoryModal from './upperbar/Modal';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchElements,
  getElementToLabel,
  checkStatus,
  fetchCategories,
  getPositiveElementForCategory,
  checkModelUpdate,
  fetchDocuments,
  setFocusedState,
  fetchCertainDocument,
  setDocIsLoaded,
  setElementLabel,
  setIsCategoryLoaded,
} from './DataSlice.jsx';
import WorkspaceInfo from './information/WorkspaceInfo';
import Sidebar from './sidebar/Sidebar';
import UpperBar from './upperbar/UpperBar';
import MainContent from './main/MainContent'

const drawerWidth = 280;
export default function Workspace() {
  const workspaceId = JSON.parse(window.localStorage.getItem('workspaceId'))
  const [open, setOpen] = React.useState(false);
  const workspace = useSelector(state => state.workspace)
  const focusedState = useSelector(state => state.workspace.focusedState)
  const isDocLoaded = useSelector(state => state.workspace.isDocLoaded)
  const isDPageChanged = useSelector(state => state.workspace.isDPageChanged)
  const [numLabel, setNumLabel] = React.useState({ pos: 0, neg: 0 })
  const [modalOpen, setModalOpen] = React.useState(false)
  const [numLabelGlobal, setNumLabelGlobal] = React.useState({ pos: workspace.pos_label_num, neg: workspace.neg_label_num })
  const [searchedItem, setSearchedItem] = React.useState()
  const [searchedIndex, setSearchedIndex] = React.useState()
  const [element, setElemenent] = React.useState()

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

  const refAnimationInstance = useRef(null);

  const makeShot = useCallback((particleRatio, opts) => {
    refAnimationInstance.current &&
      refAnimationInstance.current({
        ...opts,
        origin: { y: 0.7 },
        particleCount: Math.floor(100 * particleRatio),
        colors: ["#BE3092", "#166CFF", "#8ECCF3", "#88A8FB"]
      });
  }, []);

  const fire = useCallback(() => {

    makeShot(0.25, {
      spread: 26,
      startVelocity: 55
    });

    makeShot(0.2, {
      spread: 60
    });

    makeShot(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });

    makeShot(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });

    makeShot(0.1, {
      spread: 120,
      startVelocity: 45
    });
  }, [makeShot]);

  const handleClick = (event, id) => {
    if (event.detail == 1) {
      dispatch(setFocusedState(id))
    }
  }

  const dispatch = useDispatch();

  React.useEffect(() => {
    dispatch(setIsCategoryLoaded(false))
    dispatch(fetchDocuments()).then(() => dispatch(fetchElements()).then(() => dispatch(fetchCategories()).then(() => {
      dispatch(checkStatus()).then(() => {
        dispatch(getElementToLabel()).then(() => {
          dispatch(setIsCategoryLoaded(true))
        })
      })
    })))

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

  React.useEffect(() => {
    setNumLabelGlobal({ pos: workspace.pos_label_num, neg: workspace.neg_label_num })
  }, [workspace.pos_label_num])

  React.useEffect(() => {
    console.log(`model updated, data retrieved, model version: ${workspace.model_version}`)
    if (workspace.model_version > 0) {
      fire();
    }
    dispatch(getPositiveElementForCategory()).then(() => dispatch(getElementToLabel()))

  }, [workspace.model_version])


  React.useEffect(() => {
    if (focusedState || isDocLoaded || isDPageChanged) {
      element && element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }

  }, [focusedState, element, isDocLoaded, isDPageChanged])


  const handleSearchPanelClick = (docid, id) => {

    const splits = id.split("-")
    const index = parseInt(splits[splits.length - 1])
    setSearchedIndex(index)
    const element = document.getElementById('L' + index);
    setElemenent(element)
    element && element.scrollIntoView({
      behavior: "smooth",
      block: "start",
      // inline: "nearest"
    })

    if (docid != workspace.curDocName) {
      dispatch(fetchCertainDocument({ docid, id, switchStatus: 'switch' })).then(() => {
        dispatch(setFocusedState(index))
 
      })
    } else {
      dispatch(setFocusedState(index))
    }

  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <WorkspaceInfo workspaceId={workspaceId} />
      <Box component="main" sx={{ padding: 0 }}>
        <UpperBar setNumLabel={setNumLabel} setModalOpen={setModalOpen} setNumLabelGlobal={setNumLabelGlobal} open={open} />
        <Sidebar open={open} setOpen={setOpen} handleSearchPanelClick={handleSearchPanelClick} />
          <MainContent setNumLabel={setNumLabel}
            handleKeyEvent={handleKeyEvent}
            numLabelGlobal={numLabelGlobal}
            setNumLabelGlobal={setNumLabelGlobal}
            numLabel={numLabel}
            handleClick={handleClick}
            open={open}
            searchedItem={searchedItem}
          />
      </Box>
      <CreateCategoryModal open={modalOpen} setOpen={setModalOpen} />
    </Box>
  );
}

