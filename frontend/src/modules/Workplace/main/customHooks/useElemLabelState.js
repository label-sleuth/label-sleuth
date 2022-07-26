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
  setElementLabel,
  checkStatus,
  setLabelState,
  setSearchLabelState,
  setRecommendToLabelState,
  setPosElemLabelState,
  setPosPredLabelState,
  setEvaluationLabelState,
  setSuspiciousElemLabelState,
  setContradictiveElemLabelState,
  updateDocumentLabelCountByDiff,
} from "../../redux/DataSlice";
import { useDispatch, useSelector } from "react-redux";
import { sidebarOptionEnum } from "../../../../const";
import { getBooleanLabel, getNewLabelState } from "../../../../utils/utils";

const useElemLabelState = ({ index, elementURI }) => {
  const dispatch = useDispatch();
  const labelState = useSelector((state) => state.workspace.labelState);
  const activePanel = useSelector((state) => state.workspace.activePanel);

  const searchLabelState = useSelector((state) => state.workspace.searchLabelState);
  const recommendToLabelState = useSelector((state) => state.workspace.recommendToLabelState);
  const posPredLabelState = useSelector((state) => state.workspace.posPredLabelState);
  const posElemLabelState = useSelector((state) => state.workspace.posElemLabelState);
  const suspiciousElemLabelState = useSelector((state) => state.workspace.suspiciousElemLabelState);
  const contradictiveElemPairsLabelState = useSelector((state) => state.workspace.contradictiveElemPairsLabelState);
  const evaluationLabelState = useSelector((state) => state.workspace.evaluation.labelState);

  const curDocName = useSelector((state) => state.workspace.curDocName);

  /**
   * Find the labeled main element in the opened sidebar panel. If it doesn't exist returns null
   * @param {The list of element label state that is going to be updated} newPanelLabelState
   * @returns The sidebarElementURI or null
   */
  const getSearchPanelIndex = (newPanelLabelState) => {
    for (let sidebarElementURI in newPanelLabelState) {
      if (
        elementURI ===
        sidebarElementURI.slice(sidebarElementURI.indexOf("-") + 1)
      ) {
        return sidebarElementURI;
      }
    }
    return null;
  };

  const getPanelElements = () => {
    let newPanelLabelState;
    let updatePanelLabelState;
    switch (activePanel) {
      case sidebarOptionEnum.SEARCH:
        newPanelLabelState = { ...searchLabelState };
        updatePanelLabelState = setSearchLabelState;
        break;
      case sidebarOptionEnum.LABEL_NEXT:
        newPanelLabelState = { ...recommendToLabelState };
        updatePanelLabelState = setRecommendToLabelState;
        break;
      case sidebarOptionEnum.POSITIVE_PREDICTIONS:
        newPanelLabelState = { ...posPredLabelState };
        updatePanelLabelState = setPosPredLabelState;
        break;
    case sidebarOptionEnum.POSITIVE_LABELS:
        // elemLabelState update is managed in the setElementLabel.fulfilled action
        break;
    case sidebarOptionEnum.SUSPICIOUS_LABELS:
        newPanelLabelState = { ...suspiciousElemLabelState };
        updatePanelLabelState = setSuspiciousElemLabelState;
        break;
    case sidebarOptionEnum.CONTRADICTING_LABELS:
        newPanelLabelState = { ...contradictiveElemPairsLabelState };
        updatePanelLabelState = setContradictiveElemLabelState;
        break;
    case sidebarOptionEnum.EVALUATION:
        newPanelLabelState = { ...evaluationLabelState };
        updatePanelLabelState = setEvaluationLabelState;
        break;
    }
    return { newPanelLabelState, updatePanelLabelState };
  };

  /**
   * This function is reponsible for managing main elements label state and updating
   * the sidebar panel view if needed
   * @param  {The label action: can be 'pos' or 'neg'} labelAction
   */
  const handleLabelState = (labelAction) => {
    const { newPanelLabelState, updatePanelLabelState } = getPanelElements();
    const searchPanelIndex = getSearchPanelIndex(newPanelLabelState);

    let mainElemIndex = `L${index}`;
    const newMainLabelState = { ...labelState };

    const { documentLabelCountChange, newLabel } = getNewLabelState(
      newMainLabelState[mainElemIndex],
      labelAction
    );

    newMainLabelState[mainElemIndex] = newLabel;

    dispatch(updateDocumentLabelCountByDiff(documentLabelCountChange));

    
    dispatch(
      setElementLabel({
        element_id: elementURI,
        docid: curDocName,
        label: getBooleanLabel(newLabel),
      })
      ).then(() => {
        dispatch(checkStatus());
        dispatch(setLabelState(newMainLabelState));
        if (searchPanelIndex !== null && newPanelLabelState && updatePanelLabelState) {
          newPanelLabelState[searchPanelIndex] = newLabel;
          dispatch(updatePanelLabelState(newPanelLabelState));
      }
    });
  };

  const handlePosLabelState = () => {
    handleLabelState("pos");
  };

  const handleNegLabelState = () => {
    handleLabelState("neg");
  };

  return {
    handlePosLabelState,
    handleNegLabelState,
  };
};

export default useElemLabelState;
