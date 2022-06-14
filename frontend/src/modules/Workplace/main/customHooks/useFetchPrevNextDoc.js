import { fetchPrevDocElements, fetchNextDocElements, } from '../../DataSlice.jsx';
import { useDispatch, useSelector } from 'react-redux';

const useFetchPrevNextDoc = () => {
    const workspace = useSelector(state => state.workspace)
    const dispatch = useDispatch()

    const scrollIntoElementView = () => {
        const element = document.getElementById('L0')
        element && element.scrollIntoView({
            behavior: "smooth",
            block: "center"
        })
    }

    const handleFetchNextDoc = () => {
        if (workspace.curDocId < workspace.documents.length - 1) {
            dispatch(fetchNextDocElements()).then(() => {
                scrollIntoElementView()
            })
        }
    }

    const handleFetchPrevDoc = () => {
        if (workspace.curDocId > 0) {
            dispatch(fetchPrevDocElements()).then(() => {
                scrollIntoElementView()
            })
        }
    }

    return {
        handleFetchPrevDoc,
        handleFetchNextDoc,
    }
}
export default useFetchPrevNextDoc;

