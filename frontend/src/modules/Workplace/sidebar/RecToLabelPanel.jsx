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

import { Box } from '@mui/material';
import React from 'react';
import classes from './index.module.css';
import { useSelector } from 'react-redux';
import Element from './Element';
import useSearchElement from './customHooks/useSearchElement';
import useLabelState from './customHooks/useLabelState';

const RecToLabelPanel = ({ updateMainLabelState, updateLabelState }) => {

    const workspace = useSelector(state => state.workspace)
    let newRecLabelState = { ...workspace.recommendToLabelState }
    const currRecLabelState = workspace.recommendToLabelState
    const { handlePosLabelState, handleNegLabelState } = useLabelState(newRecLabelState, updateMainLabelState, updateLabelState)
    const { handleSearchPanelClick, searchInput } = useSearchElement()

    return (
        <Box>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItem: 'center', marginTop: "11px", borderBottom: "1px solid #e2e2e2", pb: "12px", justifyContent: 'center' }} >
                <p style={{ width: '100%', textAlign: "center"  }}><strong>Label Next</strong></p>
            </Box>

            <Box className={classes["search-results"]} >
                {workspace.elementsToLabel.map((res, i) => {
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
                            labelState={currRecLabelState}
                        />
                    )
                })}
            </Box>
        </Box>
    );
};

export default RecToLabelPanel;