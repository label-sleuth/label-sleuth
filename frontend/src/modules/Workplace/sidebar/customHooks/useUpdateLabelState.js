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

import { useDispatch } from 'react-redux';
import {
    checkStatus,
    fetchElements,
    increaseIdInBatch,
    setElementLabel,
    setRecommendToLabelState,
    setSearchLabelState,
    setPosPredLabelState,
    setPosElemLabelState,
    setDisagreeElemLabelState,
    setSuspiciousElemLabelState,
    setContradictiveElemLabelState
} from '../../DataSlice';


/**
 * This custom hook is responsible for updating the label state for the currently active sidebar panel and the main panel
 */ 
const useUpdateLabelState = () => {

    const dispatch = useDispatch()

    const updateSearchLabelState = (newPanelLabelState) => {
        dispatch(setSearchLabelState(newPanelLabelState))
    }

    const updateMainLabelState = (id, docid, label) => {
        dispatch(increaseIdInBatch())
        dispatch(setElementLabel({ element_id: id, docid: docid, label: label })).then(() => {
            dispatch(checkStatus())
            dispatch(fetchElements())
        })
    }

    const updateRecLabelState = (newPanelLabelState) => {
        dispatch(setRecommendToLabelState(newPanelLabelState))
    }

    const updatePosPredLabelState = (newPanelLabelState) => {
        dispatch(setPosPredLabelState(newPanelLabelState))
    }

    const updatePosElemLabelState = (newPanelLabelState) => {
        dispatch(setPosElemLabelState(newPanelLabelState))
    }   

    const updateDisagreelemLabelState = (newPanelLabelState) => {
        dispatch(setDisagreeElemLabelState(newPanelLabelState))
    }   

    const updateSuspiciouslemLabelState = (newPanelLabelState) => {
        dispatch(setSuspiciousElemLabelState(newPanelLabelState))
    }   

    const updateContradictivelemLabelState = (newPanelLabelState) => {
        dispatch(setContradictiveElemLabelState(newPanelLabelState))
    }   

    return {
        updateRecLabelState,
        updateMainLabelState,
        updateSearchLabelState,
        updatePosPredLabelState,
        updatePosElemLabelState,
        updateDisagreelemLabelState,
        updateSuspiciouslemLabelState,
        updateContradictivelemLabelState
    }
};

export default useUpdateLabelState;