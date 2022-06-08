import { setElementLabel, checkStatus, setLabelState, increaseIdInBatch, setNumLabel, setNumLabelGlobal, setSearchPanelLabelState } from '../../DataSlice';
import { useDispatch, useSelector } from 'react-redux';

const useSearchLabelState = () => {

    const workspace = useSelector(state => state.workspace)
    const dispatch = useDispatch()
    const numLabel = useSelector(state => state.workspace.numLabel)
    const numLabelGlobal = useSelector(state => state.workspace.numLabelGlobal)
    let searchPanelLabelNewState = { ...workspace.searchPanelLabelState }
    let newMainState = { ...workspace.labelState }

    const getMainPanelIndex =(id) =>{
        const lastIndex = id.lastIndexOf('-');
        return id.slice(lastIndex + 1);
    }

    const getMainPanelId =(e) =>{
        return e.target.parentNode.parentNode.id;
    }

    const getSearchedIndex =(e) =>{
        return e.target.parentNode.parentNode.getAttribute('searchedIndex')
    }
    
    const updateLabelsState = (id, label, searchPanelLabelNewState, newMainState) => {
        dispatch(increaseIdInBatch())
        dispatch(setElementLabel({ element_id: id, docid: workspace.curDocName, label: label })).then(() => {
            dispatch(checkStatus())
        })
        dispatch(setSearchPanelLabelState(searchPanelLabelNewState))
        dispatch(setLabelState(newMainState))
    }

 
    const handlePosLabelState = (e) => {
        let searchedIndex = getSearchedIndex(e) 
        let id = getMainPanelId(e)
        let index = getMainPanelIndex(id)
        let label = ""
        
        if (searchPanelLabelNewState['L' + searchedIndex + '-' + id] == "pos") {
            setNumLabel({ ...numLabel, "pos": numLabel['pos'] - 1 })
            setNumLabelGlobal({ ...numLabelGlobal, "pos": numLabelGlobal['pos'] - 1 })
            searchPanelLabelNewState['L' + searchedIndex + '-' + id] = ""
            newMainState['L' + index] = ""
            label = ""

        }
        else {
            if (searchPanelLabelNewState['L' + searchedIndex + '-' + id] == "neg") {
                setNumLabel({ "pos": numLabel['pos'] + 1, "neg": numLabel['neg'] - 1 })
                setNumLabelGlobal({ "pos": numLabelGlobal['pos'] + 1, "neg": numLabelGlobal['neg'] - 1 })
            }
            else {
                setNumLabel({ ...numLabel, "pos": numLabel['pos'] + 1 })
                setNumLabelGlobal({ ...numLabelGlobal, "pos": numLabelGlobal['pos'] + 1 })
            }
            searchPanelLabelNewState['L' + searchedIndex + '-' + id] = "pos"
            newMainState['L' + index] = "pos"
            label = "true"
        }
            updateLabelsState(id, label, searchPanelLabelNewState, newMainState)
    }


    const handleNegLabelState = (e) => {
        let searchedIndex = getSearchedIndex(e) 
        let id = getMainPanelId(e)
        let index = getMainPanelIndex(id)
        let label = ""

        if (searchPanelLabelNewState['L' + searchedIndex + '-' + id] == "neg") {
            setNumLabel({ ...numLabel, "neg": numLabel['neg'] - 1 })
            setNumLabelGlobal({ ...numLabelGlobal, "neg": numLabelGlobal['neg'] - 1 })
            newMainState['L' + index] = label
            searchPanelLabelNewState['L' + searchedIndex + '-' + id] = label
        }
        else {
            if (searchPanelLabelNewState['L' + searchedIndex + '-' + id] == "pos") {
                setNumLabel({ "pos": numLabel['pos'] - 1, "neg": numLabel['neg'] + 1 })
                setNumLabelGlobal({ "pos": numLabelGlobal['pos'] - 1, "neg": numLabelGlobal['neg'] + 1 })
            }
            else {
                setNumLabel({ ...numLabel, "neg": numLabel['neg'] + 1 })
                setNumLabelGlobal({ ...numLabelGlobal, "neg": numLabelGlobal['neg'] + 1 })
            }
            newMainState['L' + index] = "neg"
            searchPanelLabelNewState['L' + searchedIndex + '-' + id] = "neg"
            label = "false"
        }
        updateLabelsState(id, label, searchPanelLabelNewState, newMainState)
    }

    return {
        handlePosLabelState,
        handleNegLabelState,
    }
};

export default useSearchLabelState;