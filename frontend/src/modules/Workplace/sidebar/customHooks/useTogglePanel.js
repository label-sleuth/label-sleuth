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
import { workspacesReducer } from '../../../Workspace-config/workspaceConfigSlice';
import { getElementToLabel, setActivePanel } from '../../DataSlice';

const useTogglePanel = (setOpen, textInput) => {

    const dispatch = useDispatch()
    const elementsToLabel = useSelector(state => state.workspace.elementsToLabel)
    const [toggleSearchPanel, setToggleSearchPanel] = useState(false)
    const [toggleRCMDPanel, setToggleRCMDPanel] = useState(false)


  useEffect(() => {
      if(elementsToLabel.length == 0){
        activateSearchPanel()
      }
      else{
        activateRecToLabelPanel() 
      }
   
  }, [elementsToLabel.length])

    useEffect(() => {
        if (toggleSearchPanel || toggleRCMDPanel) {
            setOpen(true);
        }
        else {
            setOpen(false);
        }
    }, [toggleRCMDPanel, toggleSearchPanel, setOpen])

    const activateSearchPanel = () => {
        if(textInput.current){
            textInput.current.focus()
        }
        dispatch(setActivePanel("search"))
        setToggleSearchPanel(!toggleSearchPanel)
        setToggleRCMDPanel(false)
    }

    const activateRecToLabelPanel = () => {
        dispatch(getElementToLabel())
        dispatch(setActivePanel("rcmd"))
        setToggleSearchPanel(false)
        setToggleRCMDPanel(!toggleRCMDPanel)
    }

    return {
        activateSearchPanel,
        activateRecToLabelPanel,
        toggleRCMDPanel,
        toggleSearchPanel,
    }
};

export default useTogglePanel;

