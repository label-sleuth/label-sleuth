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