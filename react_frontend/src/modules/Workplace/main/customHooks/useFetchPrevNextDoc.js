import { getPositiveElementForCategory, fetchPrevDocElements, fetchNextDocElements, setNumLabel, setFocusedState } from '../../DataSlice.jsx';
import { useDispatch, useSelector } from 'react-redux';

const useFetchPrevNextDoc = () => {
    const workspace = useSelector(state => state.workspace)
    const dispatch = useDispatch()

    const getPosElemForCategory = () => {
        dispatch(getPositiveElementForCategory()).then(() => {
            setNumLabel({ pos: workspace.pos_label_num_doc, neg: workspace.neg_label_num_doc })
        })
    }

    const handleFetchNextDoc = () => {
        if (workspace.curDocId < workspace.documents.length - 1) {
            dispatch(fetchNextDocElements()).then(() => {
                dispatch(setFocusedState(0))
                getPosElemForCategory()
            })
        }
    }

    const handleFetchPrevDoc = () => {
        if (workspace.curDocId > 0) {
            dispatch(fetchPrevDocElements()).then(() => {
                dispatch(setFocusedState(0))
                getPosElemForCategory()
            })
        }
    }

    return {
        handleFetchPrevDoc,
        handleFetchNextDoc,
    }
}
export default useFetchPrevNextDoc;

