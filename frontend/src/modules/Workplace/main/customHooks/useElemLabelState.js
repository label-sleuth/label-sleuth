/*
    Copyright (c) 2022 IBM Corp.
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

import { setElementLabel, checkStatus, setLabelState, increaseIdInBatch, setSearchLabelState, setNumLabel, setNumLabelGlobal, setRecommendToLabelState } from '../../DataSlice';
import { useDispatch, useSelector } from 'react-redux';

const useElemLabelState = ({ index, element_id }) => {

    const workspace = useSelector(state => state.workspace)
    const numLabel = useSelector(state => state.workspace.numLabel)
    const numLabelGlobal = useSelector(state => state.workspace.numLabelGlobal)
    const dispatch = useDispatch()
    const activePanel = useSelector(state => state.workspace.activePanel)
    let newStateMain = { ...workspace.labelState }
    let newPanelLabelState ={}
    let searchPanelIndex = 0
 
       if(activePanel == "search"){
        newPanelLabelState = { ...workspace.searchLabelState }
        searchPanelIndex = Object.keys(newPanelLabelState).filter((id) => {
            if (id.includes(element_id)) {
                return id
            }
        })
       }
       else if(activePanel == "rcmd"){
        newPanelLabelState = { ...workspace.recommendToLabelState }
        searchPanelIndex = Object.keys(newPanelLabelState).filter((id) => {
            if (id.includes(element_id)) {
                return id
            }
        })
       }
 
       const updateLabelsState = (element_id, label, newPanelLabelState, newMainState) => {
        dispatch(increaseIdInBatch())
        dispatch(setElementLabel({ element_id: element_id, docid: workspace.curDocName, label: label })).then(() => {
            dispatch(checkStatus())
        })
        if(activePanel == "search"){
            dispatch(setSearchLabelState(newPanelLabelState))
        }
        else if(activePanel == "rcmd"){
            dispatch(setRecommendToLabelState(newPanelLabelState))
        }
        
        dispatch(setLabelState(newMainState))
    }


    const handlePosLabelState = () => {
        let label = "none"
        let mainElemIndex = `L${index}`

        if (newStateMain[mainElemIndex] == "pos") {
            setNumLabel({ ...numLabel, "pos": numLabel['pos'] - 1 })
            setNumLabelGlobal({ ...numLabelGlobal, "pos": numLabelGlobal['pos'] - 1 })
            newStateMain[mainElemIndex] = label
            newPanelLabelState[searchPanelIndex] = label
        }
        else {
            if (newStateMain[mainElemIndex] == "neg") {
                setNumLabel({ "pos": numLabel['pos'] + 1, "neg": numLabel['neg'] - 1 })
                setNumLabelGlobal({ "pos": numLabelGlobal['pos'] + 1, "neg": numLabelGlobal['neg'] - 1 })
            }
            else {
                setNumLabel({ ...numLabel, "pos": numLabel['pos'] + 1 })
                setNumLabelGlobal({ ...numLabelGlobal, "pos": numLabelGlobal['pos'] + 1 })
            }
            newStateMain[mainElemIndex] = "pos"
            newPanelLabelState[searchPanelIndex] = "pos"
            label = "true"
        }
        updateLabelsState(element_id, label, newPanelLabelState, newStateMain)
    }


    const handleNegLabelState = () => {

        let label = "none"
        let mainElemIndex = `L${index}`

        if (newStateMain[mainElemIndex] == "neg") {
            setNumLabel({ ...numLabel, "neg": numLabel['neg'] - 1 })
            setNumLabelGlobal({ ...numLabelGlobal, "neg": numLabelGlobal['neg'] - 1 })
            newStateMain[mainElemIndex] = label
            newPanelLabelState[searchPanelIndex] = label
        }
        else {
            if (newStateMain[mainElemIndex] == "pos") {
                setNumLabel({ "pos": numLabel['pos'] - 1, "neg": numLabel['neg'] + 1 })
                setNumLabelGlobal({ "pos": numLabelGlobal['pos'] - 1, "neg": numLabelGlobal['neg'] + 1 })
            }
            else {
                setNumLabel({ ...numLabel, "neg": numLabel['neg'] + 1 })
                setNumLabelGlobal({ ...numLabelGlobal, "neg": numLabelGlobal['neg'] + 1 })
            }
            newStateMain[mainElemIndex] = "neg"
            newPanelLabelState[searchPanelIndex] = "neg"
            label = "false"
        }
        updateLabelsState(element_id, label, newPanelLabelState, newStateMain)
    }



    return {
        handlePosLabelState,
        handleNegLabelState,
    }
};

export default useElemLabelState;