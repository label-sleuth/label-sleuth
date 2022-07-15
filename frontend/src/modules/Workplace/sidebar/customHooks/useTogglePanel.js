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

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  sidebarOptionEnum
} from "../../../../const";
import {   setActivePanel } from '../../DataSlice';

const useTogglePanel = (setOpen, textInput) => {

    const dispatch = useDispatch()
    const [toggleSearchPanel, setToggleSearchPanel] = useState(false)
    const [toggleRCMDPanel, setToggleRCMDPanel] = useState(false)
    const [togglePosPredPanel, setTogglePosPredPanel] = useState(false)
    const [togglePosElemPanel, setTogglePosElemPanel] = useState(false)
    const [toggleDisagreeElemPanel, setToggleDisagreeElemPanel] = useState(false)
    const [toggleSuspiciousElemPanel, setToggleSuspiciousElemPanel] = useState(false)
    const [toggleContrElemPanel, setToggleContrElemPanel] = useState(false)
    const elementsToLabel = useSelector(state => state.workspace.elementsToLabel)

    useEffect(() => {
        if(elementsToLabel.length == 0){
          activateSearchPanel()
        }
        else{
          activateRecToLabelPanel() 
        }
     
    }, [elementsToLabel.length])
  
    useEffect(() => {
        if (toggleSearchPanel || 
            toggleRCMDPanel || 
            togglePosPredPanel || 
            togglePosElemPanel || 
            toggleDisagreeElemPanel || 
            toggleSuspiciousElemPanel  ||
            toggleContrElemPanel) {
            setOpen(true);
        }
        else {
            setOpen(false);
        }
    }, [toggleRCMDPanel, toggleSearchPanel, togglePosPredPanel, togglePosElemPanel, toggleDisagreeElemPanel, toggleSuspiciousElemPanel, toggleContrElemPanel,  setOpen])

    const activateSearchPanel = () => {
        if(textInput.current){
            textInput.current.focus()
        }
        dispatch(setActivePanel(sidebarOptionEnum.SEARCH))
        setToggleSearchPanel(!toggleSearchPanel)
        setTogglePosPredPanel(false)
        setToggleRCMDPanel(false)
        setTogglePosElemPanel(false)
        setToggleDisagreeElemPanel(false)
        setToggleSuspiciousElemPanel(false)
        setToggleContrElemPanel(false)
    }

    const activateRecToLabelPanel = () => {
        dispatch(setActivePanel(sidebarOptionEnum.LABEL_NEXT))
        setToggleSearchPanel(false)
        setTogglePosPredPanel(false)
        setTogglePosElemPanel(false)
        setToggleDisagreeElemPanel(false)
        setToggleSuspiciousElemPanel(false)
        setToggleContrElemPanel(false)
        setToggleRCMDPanel(!toggleRCMDPanel)
    }

    const activatePosPredLabelPanel = () => {
        dispatch(setActivePanel(sidebarOptionEnum.POSITIVE_PREDICTIONS))
        setToggleSearchPanel(false)
        setToggleRCMDPanel(false)
        setTogglePosElemPanel(false)
        setToggleDisagreeElemPanel(false)
        setToggleSuspiciousElemPanel(false)
        setToggleContrElemPanel(false)
        setTogglePosPredPanel(!togglePosPredPanel)
    }

    const activatePosElemLabelPanel = () => {
        dispatch(setActivePanel(sidebarOptionEnum.POSITIVE_LABELS))
        setToggleSearchPanel(false)
        setToggleRCMDPanel(false)
        setTogglePosElemPanel(false)
        setTogglePosPredPanel(false)
        setToggleDisagreeElemPanel(false)
        setToggleSuspiciousElemPanel(false)
        setToggleContrElemPanel(false)
        setTogglePosElemPanel(!togglePosElemPanel)
    }

    const activateDisagreeElemLabelPanel = () => {
        dispatch(setActivePanel(sidebarOptionEnum.DISAGREEMENTS))
        setToggleSearchPanel(false)
        setToggleRCMDPanel(false)
        setTogglePosElemPanel(false)
        setTogglePosPredPanel(false)
        setTogglePosElemPanel(false)
        setToggleSuspiciousElemPanel(false)
        setToggleContrElemPanel(false)
        setToggleDisagreeElemPanel(!toggleDisagreeElemPanel)
    }

    const activateSuspiciousElemLabelPanel = () => {
        dispatch(setActivePanel(sidebarOptionEnum.SUSPICIOUS_LABELS))
        setToggleSearchPanel(false)
        setToggleRCMDPanel(false)
        setTogglePosElemPanel(false)
        setTogglePosPredPanel(false)
        setTogglePosElemPanel(false)
        setToggleDisagreeElemPanel(false)
        setToggleContrElemPanel(false)
        setToggleSuspiciousElemPanel(!toggleSuspiciousElemPanel)
    }

    const activateContrElemLabelPanel = () => {
        dispatch(setActivePanel(sidebarOptionEnum.CONTRADICTING_LABELS))
        setToggleSearchPanel(false)
        setToggleRCMDPanel(false)
        setTogglePosElemPanel(false)
        setTogglePosPredPanel(false)
        setTogglePosElemPanel(false)
        setToggleDisagreeElemPanel(false)
        setToggleSuspiciousElemPanel(false)
        setToggleContrElemPanel(!toggleContrElemPanel)
    }

    return {
        activateSearchPanel,
        activateRecToLabelPanel,
        activatePosPredLabelPanel,
        activatePosElemLabelPanel,
        activateDisagreeElemLabelPanel,
        activateSuspiciousElemLabelPanel,
        activateContrElemLabelPanel,
        toggleRCMDPanel,
        toggleSearchPanel,
        togglePosPredPanel,
        togglePosElemPanel,
        toggleDisagreeElemPanel,
        toggleSuspiciousElemPanel,
        toggleContrElemPanel,
    }
};

export default useTogglePanel;

