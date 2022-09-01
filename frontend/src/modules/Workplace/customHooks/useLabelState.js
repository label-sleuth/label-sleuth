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

import { updateDocumentLabelCountByDiff, setElementLabel, checkStatus } from "../redux/DataSlice";
import { useSelector, useDispatch } from "react-redux";
import { getNewLabelState, getBooleanLabel } from "../../../utils/utils";
import { activePanelSelector } from '../redux/DataSlice'

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
const useLabelState = (
  updateCounter = true
) => {
  const currentDocName = useSelector((state) => state.workspace.curDocName);
  const dispatch = useDispatch();

  /**
   * This function is reponsible for managing sidebar elements label state and updating
   * the main document view if needed
   * @param  {Document id, i.e (dataset1-Giant otter) } docid
   * @param  {Document id, i.e (dataset1-Giant otter-102)} id
   * @param  {The element that was clicked on the sidebar panel and needs to be found on the main panel} searchedIndex
   * @param  {The label action: can be 'pos' or 'neg'} labelAction
   */
  const handleLabelState = (element, labelAction) => {
      
    const { documentLabelCountChange, newLabel } = getNewLabelState(
      element.userLabel,
      labelAction
    );
    dispatch(setElementLabel({ 
      element_id: element.id, 
      label: getBooleanLabel(newLabel), 
      update_counter: updateCounter
    })).then(() => {
      dispatch(checkStatus())
      // Update main document view only if the side bar element belongs to the current main document
      if (currentDocName === element.docId) {
        dispatch(updateDocumentLabelCountByDiff(documentLabelCountChange));
      }
    })
  };

  const handlePosLabelState = (element) => {
    handleLabelState(element, "pos");
  };

  const handleNegLabelState = (element) => {
    handleLabelState(element, "neg");
  };

  return {
    handlePosLabelState,
    handleNegLabelState,
  };
};

export default useLabelState;
