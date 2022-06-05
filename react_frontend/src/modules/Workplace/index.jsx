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
  setIsDocLoaded,
  setIsCategoryLoaded,
  setNumLabelGlobal,
} from './DataSlice.jsx';
import WorkspaceInfo from './information/WorkspaceInfo';
import Sidebar from './sidebar/Sidebar';
import UpperBar from './upperbar/UpperBar';
import MainContent from './main/MainContent'


export default function Workspace() {
  const workspaceId = JSON.parse(window.localStorage.getItem('workspaceId'))
  const [open, setOpen] = React.useState(false);
  const workspace = useSelector(state => state.workspace)
  const [modalOpen, setModalOpen] = React.useState(false)

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


  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <WorkspaceInfo workspaceId={workspaceId} />
      <Box component="main" sx={{ padding: 0 }}>
        <UpperBar setModalOpen={setModalOpen} open={open} />
        <Sidebar open={open} setOpen={setOpen} />
        <MainContent handleKeyEvent={handleKeyEvent} handleClick={handleClick} open={open} />
      </Box>
      <CreateCategoryModal open={modalOpen} setOpen={setModalOpen} />
    </Box>
  );
}

