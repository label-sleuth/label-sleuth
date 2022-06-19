import { useDispatch } from 'react-redux';
import { checkStatus, fetchElements, increaseIdInBatch, setElementLabel, setRecommendToLabelState, setSearchLabelState } from '../../DataSlice';

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

    return {
        updateRecLabelState,
        updateMainLabelState,
        updateSearchLabelState
    }
};

export default useUpdateLabelState;