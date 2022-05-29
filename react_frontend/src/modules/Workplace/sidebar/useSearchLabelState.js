import {  useState } from 'react';
import { setElementLabel, checkStatus, setLabelState, increaseIdInBatch, fetchCertainDocument, setFocusedState } from '../DataSlice';
import { useDispatch, useSelector } from 'react-redux';

const useSearchLabelState = ({ docid, id, numLabel, numLabelHandler, numLabelGlobal, numLabelGlobalHandler, element_id }) => {

    const workspace = useSelector(state => state.workspace)
    const splits = element_id.split("-")
    const index = parseInt(splits[splits.length - 1])
    const dispatch = useDispatch()
    const [labelState, setLocalLabelState] = useState("")
    let newState = labelState

    const handlePosLabelState = (e) => {
        e.stopPropagation()

        let label = ""  

        if (newState == "pos") {
            numLabelHandler({ ...numLabel, "pos": numLabel['pos'] - 1 })
            numLabelGlobalHandler({ ...numLabelGlobal, "pos": numLabelGlobal['pos'] - 1 })
            newState = ""
        }
        else {
            if (newState == "neg") {
                numLabelHandler({ "pos": numLabel['pos'] + 1, "neg": numLabel['neg'] - 1 })
                numLabelGlobalHandler({ "pos": numLabelGlobal['pos'] + 1, "neg": numLabelGlobal['neg'] - 1 })
            }
            else {
                numLabelHandler({ ...numLabel, "pos": numLabel['pos'] + 1 })
                numLabelGlobalHandler({ ...numLabelGlobal, "pos": numLabelGlobal['pos'] + 1 })
            }
            newState = "pos"
            label = "true"
        }
        dispatch(increaseIdInBatch())
        dispatch(setElementLabel({ element_id: element_id, docid: workspace.curDocName, label: label })).then(() => {
            dispatch(checkStatus())
        })
        setLocalLabelState(newState)

        if (workspace['curDocName'] != docid) {
            var initialLabelState = {}

            for (var i = 0; i < workspace['elements'].length; i++) {
                initialLabelState['L' + i] = ""
            }
            initialLabelState['L' + index] = newState
            dispatch(setLabelState(initialLabelState))
        } else {
            var initialLabelState = { ...workspace.labelState }
            initialLabelState['L' + index] = newState
            dispatch(setLabelState(initialLabelState))
        }

        if (docid != workspace.curDocName) {
            dispatch(fetchCertainDocument({ docid, id, switchStatus: "search" })).then(() => {
                dispatch(setFocusedState(index))
            })
        } else {
            dispatch(setFocusedState(index))
        }
    }

    const handleNegLabelState = (e) => {

        e.stopPropagation()

        let label = ""

        if (newState == "neg") {
            numLabelHandler({ ...numLabel, "neg": numLabel['neg'] - 1 })
            numLabelGlobalHandler({ ...numLabelGlobal, "neg": numLabelGlobal['neg'] - 1 })
            newState = label
        }
        else {
            if (newState == "pos") {
                numLabelHandler({ "pos": numLabel['pos'] - 1, "neg": numLabel['neg'] + 1 })
                numLabelGlobalHandler({ "pos": numLabelGlobal['pos'] - 1, "neg": numLabelGlobal['neg'] + 1 })
            }
            else {
                numLabelHandler({ ...numLabel, "neg": numLabel['neg'] + 1 })
                numLabelGlobalHandler({ ...numLabelGlobal, "neg": numLabelGlobal['neg'] + 1 })
            }
            newState = "neg"
            label = "false"
        }
        dispatch(increaseIdInBatch())
        dispatch(setElementLabel({ element_id: element_id, docid: workspace.curDocName, label: label })).then(() => {
            dispatch(checkStatus())
        })

        setLocalLabelState(newState)

        if (workspace['curDocName'] != docid) {
            var initialLabelState = {}
            for (var i = 0; i < workspace['elements'].length; i++) {
                initialLabelState['L' + i] = ""
            }
            initialLabelState['L' + index] = newState
            dispatch(setLabelState(initialLabelState))
        } else {
            var initialLabelState = { ...workspace.labelState }

            initialLabelState['L' + index] = newState
            dispatch(setLabelState(initialLabelState))
        }

        if (docid != workspace.curDocName) {
            dispatch(fetchCertainDocument({ docid, id, switchStatus: "search" })).then(() => {
                dispatch(setFocusedState(index))
            })
        } else {
            dispatch(setFocusedState(index))
        }
    }

    const handleQuestLabelState = (e) => {
        e.stopPropagation()

        let label = ""

        if (newState == "ques") {
            numLabelHandler({ ...numLabel, "ques": numLabel['ques'] - 1 })
            numLabelGlobalHandler({ ...numLabelGlobal, "ques": numLabelGlobal['ques'] - 1 })
            newState = label
        }
        else {
            if (newState == "pos") {
                numLabelHandler({ "pos": numLabel['pos'] - 1, "ques": numLabel['ques'] + 1 })
                numLabelGlobalHandler({ "pos": numLabelGlobal['pos'] - 1, "ques": numLabelGlobal['ques'] + 1 })
            }
            else {
                numLabelHandler({ ...numLabel, "ques": numLabel['ques'] + 1 })
                numLabelGlobalHandler({ ...numLabelGlobal, "ques": numLabelGlobal['ques'] + 1 })
            }
            newState = "ques"
            label = "ques"
        }
        dispatch(increaseIdInBatch())
        dispatch(setElementLabel({ element_id: element_id, docid: workspace.curDocName, label: label })).then(() => {
            dispatch(checkStatus())
        })

        setLocalLabelState(newState)

        if (workspace['curDocName'] != docid) {
            var initialLabelState = {}
            for (var i = 0; i < workspace['elements'].length; i++) {
                initialLabelState['L' + i] = ""
            }
            initialLabelState['L' + index] = newState
            dispatch(setLabelState(initialLabelState))
        } else {
            var initialLabelState = { ...workspace.labelState }

            initialLabelState['L' + index] = newState
            dispatch(setLabelState(initialLabelState))
        }

        if (docid != workspace.curDocName) {
            dispatch(fetchCertainDocument({ docid, id, switchStatus: "search" })).then(() => {
                dispatch(setFocusedState(index))
            })
        } else {
            dispatch(setFocusedState(index))
        }
    }


    return {
        handlePosLabelState,
        handleNegLabelState,
        handleQuestLabelState,
        labelState,
        index,
    }
};

export default useSearchLabelState;