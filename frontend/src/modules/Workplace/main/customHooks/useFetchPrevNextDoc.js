import { getPositiveElementForCategory, fetchPrevDocElements, fetchNextDocElements, setNumLabel } from '../../DataSlice.jsx';
import { useDispatch, useSelector } from 'react-redux';

const useFetchPrevNextDoc = () => {
    const workspace = useSelector(state => state.workspace)
    const dispatch = useDispatch()

    const scrollIntoElementView = () => {
        const element = document.getElementById('L0')
        element && element.scrollIntoView({
            behavior: "smooth",
            block: "start"
        })
    }

    const getPosElemForCategory = () => {
        dispatch(getPositiveElementForCategory()).then(() => {
            setNumLabel({ pos: workspace.pos_label_num_doc, neg: workspace.neg_label_num_doc })
        })
    }

    const handleFetchNextDoc = () => {
        if (workspace.curDocId < workspace.documents.length - 1) {
            dispatch(fetchNextDocElements()).then(() => {
                scrollIntoElementView()
                getPosElemForCategory()
            })
        }
    }

    const handleFetchPrevDoc = () => {
        if (workspace.curDocId > 0) {
            dispatch(fetchPrevDocElements()).then(() => {
                scrollIntoElementView()
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

