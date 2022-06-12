import {
    setNumLabel,
    setNumLabelGlobal,
} from '../../DataSlice';
import { useSelector } from 'react-redux';

const useLabelState = (newPanelLabelState, updateMainLabelState, updatePanelLabelState) => {

    const workspace = useSelector(state => state.workspace)
    const numLabel = useSelector(state => state.workspace.numLabel)
    const numLabelGlobal = useSelector(state => state.workspace.numLabelGlobal)
    let newMainState = { ...workspace.labelState }

    const getMainPanelIndex = (id) => {
        const lastIndex = id.lastIndexOf('-');
        return id.slice(lastIndex + 1);
    }

    const getMainPanelId = (e) => {
        return e.target.parentNode.parentNode.id;
    }

    const getSearchedIndex = (e) => {
        return e.target.parentNode.parentNode.getAttribute('searchedIndex')
    }


    const handlePosLabelState = (e) => {
        let searchedIndex = getSearchedIndex(e)
        let id = getMainPanelId(e)
        let index = getMainPanelIndex(id)
        let label = ""
        let searchedElemIndex = `L${searchedIndex}-${id}`
        let mainElemIndex = `L${index}`

        if (newPanelLabelState[searchedElemIndex] == "pos") {
            setNumLabel({ ...numLabel, "pos": numLabel['pos'] - 1 })
            setNumLabelGlobal({ ...numLabelGlobal, "pos": numLabelGlobal['pos'] - 1 })
            newPanelLabelState[searchedElemIndex] = ""
            newMainState[mainElemIndex] = ""
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
            newMainState[mainElemIndex] = "pos"
            label = "true"
        }
        updateMainLabelState(id, label, newMainState)
        updatePanelLabelState(newPanelLabelState)
    }


    const handleNegLabelState = (e) => {
        let searchedIndex = getSearchedIndex(e)
        let id = getMainPanelId(e)
        let index = getMainPanelIndex(id)
        let label = ""
        let searchedElemIndex = `L${searchedIndex}-${id}`
        let mainElemIndex = `L${index}`

        if (newPanelLabelState['L' + searchedIndex + '-' + id] == "neg") {
            setNumLabel({ ...numLabel, "neg": numLabel['neg'] - 1 })
            setNumLabelGlobal({ ...numLabelGlobal, "neg": numLabelGlobal['neg'] - 1 })
            newMainState[mainElemIndex] = ""
            newPanelLabelState[searchedElemIndex] = ""
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
            newMainState[mainElemIndex] = "neg"
            newPanelLabelState[searchedElemIndex] = "neg"
            label = "false"
        }
        updateMainLabelState(id, label, newMainState)
        updatePanelLabelState(newPanelLabelState)
    }

    return {
        handlePosLabelState,
        handleNegLabelState,
    }
};

export default useLabelState;