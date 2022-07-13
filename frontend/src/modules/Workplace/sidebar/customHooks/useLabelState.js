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


/**
 * This custom hook is responsible for managing the labels states 
 ** for the current sidebar's active panels and for updating the main labels state panel. 
 * The labels states are managed per each category. 
 * When a user clicks on one of the positive or the negative element's icons in the current active sidebar panel, 
 ** this function will handle the appropriate states accordingly (i.e. positive, negative or none).
 * The updateMainLabelState and updatePanelLabelState props are returned 
 ** from the useUpdateLabelState and passed as props to the active panel and
 *** update the current labels state
 * @param  {A new state for a current active panel } newPanelLabelState
 * @param  { The main panel's state } updateMainLabelState
 * @param  { The active sidebar's panel state} updatePanelLabelState
 */
const useLabelState = (newPanelLabelState, updateMainLabelState, updatePanelLabelState) => {

    const numLabel = useSelector(state => state.workspace.numLabel)
    const numLabelGlobal = useSelector(state => state.workspace.numLabelGlobal)

    /**
     * This function is reponsible for managing the positive elements state only
     * @param  {Document id, i.e (dataset1-Giant otter) } docid
     * @param  {Document id, i.e (dataset1-Giant otter-102)} id
     * @param  {The element that was clicked on the sidebar panel and needs to be found on the main panel} searchedIndex
     */
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
        /**
         * The following parameters are passed to setElementLabel function 
         * @param  {Document id, i.e (dataset1-Giant otter) } docid
         * @param  {Document id, i.e (dataset1-Giant otter-102)} id
         * @param  {The current label value: true, false or none } label
         */
        updateMainLabelState(id, docid, label)

        /**
         * @param  {The updated label state contains the current state of labeling 
         * for each element in the active sidebar panel} newPanelLabelState
         */
        updatePanelLabelState(newPanelLabelState)
    }

    /**
     * This function is reponsible for managing the negative elements state only
     * @param  {Document id, i.e (dataset1-Giant otter) } docid
     * @param  {Document id, i.e (dataset1-Giant otter-102)} id
     * @param  {The element that was clicked on the sidebar panel and needs to be found on the main panel} searchedIndex
     */
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
