import { setElementLabel, checkStatus, setLabelState, increaseIdInBatch, setSearchPanelLabelState, setNumLabel, setNumLabelGlobal } from '../../DataSlice';
import { useDispatch, useSelector } from 'react-redux';

const useElemLabelState = ({ index, element_id }) => {

    const workspace = useSelector(state => state.workspace)
    const numLabel = useSelector(state => state.workspace.numLabel)
    const numLabelGlobal = useSelector(state => state.workspace.numLabelGlobal)
    const searchPanelLabelState = useSelector(state => state.workspace.searchPanelLabelState)
    const dispatch = useDispatch()
    let newStateMain = { ...workspace.labelState }
    let newState = { ...workspace.searchPanelLabelState }

    let searchPanelIndex = Object.keys(searchPanelLabelState).filter((id) => {
        if (id.includes(element_id)) {
            return id
        }
    })

    const handlePosLabelState = () => {
        let label = ""

        if (newStateMain['L' + index] == "pos") {
            setNumLabel({ ...numLabel, "pos": numLabel['pos'] - 1 })
            setNumLabelGlobal({ ...numLabelGlobal, "pos": numLabelGlobal['pos'] - 1 })
            newStateMain['L' + index] = ""
            newState[searchPanelIndex] = ""
        }
        else {
            if (newStateMain['L' + index] == "neg") {
                setNumLabel({ "pos": numLabel['pos'] + 1, "neg": numLabel['neg'] - 1 })
                setNumLabelGlobal({ "pos": numLabelGlobal['pos'] + 1, "neg": numLabelGlobal['neg'] - 1 })
            }
            else {
                setNumLabel({ ...numLabel, "pos": numLabel['pos'] + 1 })
                setNumLabelGlobal({ ...numLabelGlobal, "pos": numLabelGlobal['pos'] + 1 })
            }
            newStateMain['L' + index] = "pos"
            newState[searchPanelIndex] = "pos"
            label = "true"
        }
        dispatch(increaseIdInBatch())
        dispatch(setElementLabel({ element_id: element_id, docid: workspace.curDocName, label: label })).then(() => {
            dispatch(checkStatus())
        })
        dispatch(setLabelState(newStateMain))
        dispatch(setSearchPanelLabelState(newState))
    }

    const handleNegLabelState = () => {

        let label = ""

        if (newStateMain['L' + index] == "neg") {
            setNumLabel({ ...numLabel, "neg": numLabel['neg'] - 1 })
            setNumLabelGlobal({ ...numLabelGlobal, "neg": numLabelGlobal['neg'] - 1 })
            newStateMain['L' + index] = label
            newState[searchPanelIndex] = label
        }
        else {
            if (newStateMain['L' + index] == "pos") {
                setNumLabel({ "pos": numLabel['pos'] - 1, "neg": numLabel['neg'] + 1 })
                setNumLabelGlobal({ "pos": numLabelGlobal['pos'] - 1, "neg": numLabelGlobal['neg'] + 1 })
            }
            else {
                setNumLabel({ ...numLabel, "neg": numLabel['neg'] + 1 })
                setNumLabelGlobal({ ...numLabelGlobal, "neg": numLabelGlobal['neg'] + 1 })
            }
            newStateMain['L' + index] = "neg"
            newState[searchPanelIndex] = "neg"
            label = "false"
        }
        dispatch(increaseIdInBatch())
        dispatch(setElementLabel({ element_id: element_id, docid: workspace.curDocName, label: label })).then(() => {
            dispatch(checkStatus())
        })
        dispatch(setLabelState(newStateMain))
        dispatch(setSearchPanelLabelState(newState))
    }



    return {
        handlePosLabelState,
        handleNegLabelState,
    }
};

export default useElemLabelState;