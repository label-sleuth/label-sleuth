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

import { Box } from "@mui/system";
import Stack from '@mui/material/Stack';
import { useSelector } from 'react-redux';
import checking from '../Asset/checking.svg';
import check from '../Asset/check.svg';
import crossing from '../Asset/crossing.svg';
import cross from '../Asset/cross.svg';
import classes from './Element.module.css';
import useMainLabelState from '../customHooks/useLabelState';
import useElemStyles from "./customHooks/useElemStyles";
import { getMainPanelElementId } from "../../../utils/utils";
import { panelIds } from "../../../const";
export default function Element({ element }) {
    
    const { id, text, userLabel, modelPrediction } = element

    const curCategory = useSelector(state => state.workspace.curCategory) 
    const evaluationIsInProgress = useSelector(state => state.workspace.panels[panelIds.EVALUATION].isInProgress) 
    const { handlePosLabelState, handleNegLabelState } = useMainLabelState({ elementURI: id })
    const elementDOMId = getMainPanelElementId(id)
    const { handleTextElemStyle,  text_colors } = useElemStyles(elementDOMId, modelPrediction)
    
    return (
        curCategory  === null ?
            <Box 
                tabIndex="-1" 
                className={handleTextElemStyle()} 
                id={elementDOMId}
            >
                <p className={classes["nodata_text"]}>{text}</p>
            </Box>
            :
            <Box tabIndex="-1"
                className={handleTextElemStyle()}
                id={elementDOMId} 
            >
                <p className={classes.data_text} style={(text_colors[userLabel])}>{text}</p>
                <Stack className={!evaluationIsInProgress && classes.checking_buttons} direction="row" spacing={0}>
                    <div
                        onClick={(e) => { e.stopPropagation(); handlePosLabelState(element)}}
                        style={{ cursor: "pointer" }}>
                        {userLabel === 'pos' ?
                            <img className={classes.resultbtn} loading="eager" src={check} alt="checked" /> :
                                <img className={classes.hovbtn} loading="eager" src={checking} alt="checking" />
                        }
                    </div>
                    <div  
                        onClick={(e) => { e.stopPropagation(); handleNegLabelState(element)}}
                        style={{ cursor: "pointer" }}>
                        {userLabel === 'neg' ?
                            <img className={classes.resultbtn}  loading="eager" src={cross} alt="crossed" /> :
                            <img className={classes.hovbtn}  loading="eager" src={crossing} alt="crossinging" />
                        }
                    </div>
                </Stack>
            </Box>
    )
}