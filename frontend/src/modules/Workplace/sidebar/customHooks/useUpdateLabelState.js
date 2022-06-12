import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { checkStatus, increaseIdInBatch, setElementLabel, setLabelState, setRecommendToLabelState, setSearchLabelState } from '../../DataSlice';

const useUpdateLabelState = () => {

    const dispatch = useDispatch()
    const workspace = useSelector(state => state.workspace)
    
    const updateSearchLabelState = (newPanelLabelState) => {
        dispatch(setSearchLabelState(newPanelLabelState))
    }
    const updateMainLabelState = (id, label, newMainState) => {
        dispatch(increaseIdInBatch())
        dispatch(setElementLabel({ element_id: id, docid: workspace.curDocName, label: label })).then(() => {
            dispatch(checkStatus())
        })
        dispatch(setLabelState(newMainState))
    }
    
    const updateRecLabelState = (newPanelLabelState) => {
        dispatch(setRecommendToLabelState(newPanelLabelState))
    }

    return {
        updateRecLabelState,
        updateMainLabelState,
        updateSearchLabelState
    }
};

export default useUpdateLabelState;