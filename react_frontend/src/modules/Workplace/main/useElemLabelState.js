import {useEffect} from 'react';
import { setElementLabel, checkStatus, setLabelState, increaseIdInBatch } from '../DataSlice';
import { useDispatch, useSelector } from 'react-redux';

const useElemLabelState = ({numLabelGlobal, numLabelGlobalHandler, index, numLabel, numLabelHandler, element_id, prediction}) => {

    const workspace = useSelector(state => state.workspace)
    const dispatch = useDispatch()
    let newState = { ...workspace.labelState }
    

    const handlePosLabelState = () =>{
        let label = ""  

        if (newState['L' + index] == "pos") {
            numLabelHandler({ ...numLabel, "pos": numLabel['pos'] - 1 })
            numLabelGlobalHandler({ ...numLabelGlobal, "pos": numLabelGlobal['pos'] - 1 })
            newState['L' + index] = ""
        }
        else {
            if (newState['L' + index] == "neg") {
                numLabelHandler({ "pos": numLabel['pos'] + 1, "neg": numLabel['neg'] - 1 })
                numLabelGlobalHandler({ "pos": numLabelGlobal['pos'] + 1, "neg": numLabelGlobal['neg'] - 1 })
            }
            else {
                numLabelHandler({ ...numLabel, "pos": numLabel['pos'] + 1 })
                numLabelGlobalHandler({ ...numLabelGlobal, "pos": numLabelGlobal['pos'] + 1 })
            }
            newState['L' + index] = "pos"
            label = "true"
        }
        dispatch(increaseIdInBatch())
        dispatch(setElementLabel({ element_id: element_id, docid: workspace.curDocName, label: label })).then(() => {
            dispatch(checkStatus())
        })
        dispatch(setLabelState(newState))
    }

    const handleNegLabelState = () =>{

        let label = ""

        if (newState['L' + index] == "neg") {
            numLabelHandler({ ...numLabel, "neg": numLabel['neg'] - 1 })
            numLabelGlobalHandler({ ...numLabelGlobal, "neg": numLabelGlobal['neg'] - 1 })
            newState['L' + index] = label
        }
        else {
            if (newState['L' + index] == "pos") {
                numLabelHandler({ "pos": numLabel['pos'] - 1, "neg": numLabel['neg'] + 1 })
                numLabelGlobalHandler({ "pos": numLabelGlobal['pos'] - 1, "neg": numLabelGlobal['neg'] + 1 })
            }
            else {
                numLabelHandler({ ...numLabel, "neg": numLabel['neg'] + 1 })
                numLabelGlobalHandler({ ...numLabelGlobal, "neg": numLabelGlobal['neg'] + 1 })
            }
            newState['L' + index] = "neg"
            label = "false"
        }
        dispatch(increaseIdInBatch())
        dispatch(setElementLabel({ element_id: element_id, docid: workspace.curDocName, label: label })).then(() => {
            dispatch(checkStatus())
        })
        dispatch(setLabelState(newState))
    }

    const handleQuestLabelState = () =>{

        if (newState['L' + index] != "ques") {
            newState['L' + index] = "ques"
        } else {
            newState['L' + index] = ''
        }

        dispatch(setLabelState(newState))
    }


    return  {
        handlePosLabelState,
        handleNegLabelState,
        handleQuestLabelState,
    }
};

export default useElemLabelState;