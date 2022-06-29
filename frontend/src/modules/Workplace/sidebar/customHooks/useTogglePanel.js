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
import { useDispatch } from 'react-redux';
import { POS_PREDICTIONS, RCMD, SEARCH } from '../../../../const';
import {   setActivePanel } from '../../DataSlice';

const useTogglePanel = (setOpen, textInput) => {

    const dispatch = useDispatch()
    const [toggleSearchPanel, setToggleSearchPanel] = useState(false)
    const [toggleRCMDPanel, setToggleRCMDPanel] = useState(false)
    const [togglePosPredPanel, setTogglePosPredPanel] = useState(false)

    useEffect(() => {
        if (toggleSearchPanel || toggleRCMDPanel || togglePosPredPanel) {
            setOpen(true);
        }
        else {
            setOpen(false);
        }
    }, [toggleRCMDPanel, toggleSearchPanel, togglePosPredPanel, setOpen])

    const activateSearchPanel = () => {
        if(textInput.current){
            textInput.current.focus()
        }
        dispatch(setActivePanel(SEARCH))
        setToggleSearchPanel(!toggleSearchPanel)
        setTogglePosPredPanel(false)
        setToggleRCMDPanel(false)
    }

    const activateRecToLabelPanel = () => {
        dispatch(setActivePanel(RCMD))
        setToggleSearchPanel(false)
        setTogglePosPredPanel(false)
        setToggleRCMDPanel(!toggleRCMDPanel)
    }

    const activatePosPredLabelPanel = () => {
        dispatch(setActivePanel(POS_PREDICTIONS))
        setToggleSearchPanel(false)
        setToggleRCMDPanel(false)
        setTogglePosPredPanel(!togglePosPredPanel)
    }

    return {
        activateSearchPanel,
        activateRecToLabelPanel,
        activatePosPredLabelPanel,
        toggleRCMDPanel,
        toggleSearchPanel,
        togglePosPredPanel,
    }
};

export default useTogglePanel;

