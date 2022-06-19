import {
    setNumLabel,
    setNumLabelGlobal,
} from '../../DataSlice';
import { useSelector } from 'react-redux';

const useLabelState = (newPanelLabelState, updateMainLabelState, updatePanelLabelState) => {

    const numLabel = useSelector(state => state.workspace.numLabel)
    const numLabelGlobal = useSelector(state => state.workspace.numLabelGlobal)

    const handlePosLabelState = (docid, id, searchedIndex) => {
        let label = "none"
        let searchedElemIndex = `L${searchedIndex}-${id}`

        if (newPanelLabelState[searchedElemIndex] == "pos") {
            setNumLabel({ ...numLabel, "pos": numLabel['pos'] - 1 })
            setNumLabelGlobal({ ...numLabelGlobal, "pos": numLabelGlobal['pos'] - 1 })
            newPanelLabelState[searchedElemIndex] = label
        }
        else {
            if (newPanelLabelState[searchedElemIndex] == "neg") {
                setNumLabel({ "pos": numLabel['pos'] + 1, "neg": numLabel['neg'] - 1 })
                setNumLabelGlobal({ "pos": numLabelGlobal['pos'] + 1, "neg": numLabelGlobal['neg'] - 1 })
            }
            else {
                setNumLabel({ ...numLabel, "pos": numLabel['pos'] + 1 })
                setNumLabelGlobal({ ...numLabelGlobal, "pos": numLabelGlobal['pos'] + 1 })
            }
            newPanelLabelState[searchedElemIndex] = "pos"
            label = "true"
        }
        updateMainLabelState(id, docid, label)
        updatePanelLabelState(newPanelLabelState)
    }


    const handleNegLabelState = (docid, id, searchedIndex) => {
        let label = "none"
        let searchedElemIndex = `L${searchedIndex}-${id}`

        if (newPanelLabelState['L' + searchedIndex + '-' + id] == "neg") {
            setNumLabel({ ...numLabel, "neg": numLabel['neg'] - 1 })
            setNumLabelGlobal({ ...numLabelGlobal, "neg": numLabelGlobal['neg'] - 1 })
            newPanelLabelState[searchedElemIndex] = label
        }
        else {
            if (newPanelLabelState[searchedElemIndex] == "pos") {
                setNumLabel({ "pos": numLabel['pos'] - 1, "neg": numLabel['neg'] + 1 })
                setNumLabelGlobal({ "pos": numLabelGlobal['pos'] - 1, "neg": numLabelGlobal['neg'] + 1 })
            }
            else {
                setNumLabel({ ...numLabel, "neg": numLabel['neg'] + 1 })
                setNumLabelGlobal({ ...numLabelGlobal, "neg": numLabelGlobal['neg'] + 1 })
            }
            newPanelLabelState[searchedElemIndex] = "neg"
            label = "false"
        }
        updateMainLabelState(id, docid, label)
        updatePanelLabelState(newPanelLabelState)
    }

    return {
        handlePosLabelState,
        handleNegLabelState,
    }
};

export default useLabelState;