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

import { Box, Typography } from '@mui/material';
import React from 'react';
import classes from './index.module.css';
import { useSelector } from 'react-redux';
import Element from './Element';
import useSearchElement from './customHooks/useSearchElement';
import useLabelState from './customHooks/useLabelState';

const PosPredictionsPanel = ({ updateMainLabelState, updateLabelState }) => {

    const workspace = useSelector(state => state.workspace)
    const posPredTotalElemRes = useSelector(state => state.workspace.posPredTotalElemRes)
    const posPredFraction = useSelector(state => state.workspace.posPredFraction)
    const posPredResult = useSelector(state => state.workspace.posPredResult)
    let newPosPredLabelState = { ...workspace.posPredLabelState}
    const currPosPredLabelState = workspace.posPredLabelState
    const { handlePosLabelState, handleNegLabelState } = useLabelState(newPosPredLabelState, updateMainLabelState, updateLabelState)
    const { handleSearchPanelClick, searchInput } = useSearchElement()

    return (
        <Box>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItem: 'center', marginTop: "11px", borderBottom: "1px solid #e2e2e2", pb: "12px", justifyContent: 'center' }} >
                <p style={{ width: '100%', textAlign: "center"  }}><strong>Positive predictions</strong></p>
            </Box>
            {posPredResult && posPredResult.length > 0 &&
                <Box  sx={{ display: "flex", justifyContent: "center", mt:1, fontSize: "0.8rem", color: "rgba(0,0,0,.54)" }} >
                    <Typography sx={{ display: "flex", justifyContent: "center", fontSize: "0.8rem", color: "rgba(0,0,0,.54)" }}>
                        {`${posPredTotalElemRes}  positive in workspace, ${Number((posPredFraction).toFixed(1))*100}% of all text elements`} 
                    </Typography>
                </Box>}
            <Box className={classes["search-results"]} sx={{mt:1}}>
                {workspace.posPredResult.map((res, i) => {
                    return (
                        <Element
                            key={i}
                            searchedIndex={i}
                            prediction={res.model_predictions[workspace.curCategory]}
                            text={res.text}
                            searchInput={searchInput}
                            id={res.id}
                            docid={res.docid}
                            labelValue={res.user_labels[workspace.curCategory]}
                            handleSearchPanelClick={handleSearchPanelClick}
                            handlePosLabelState={handlePosLabelState}
                            handleNegLabelState={handleNegLabelState}
                            labelState={currPosPredLabelState}
                        />
                    )
                })}
            </Box>
        </Box>
    );
};

export default PosPredictionsPanel;