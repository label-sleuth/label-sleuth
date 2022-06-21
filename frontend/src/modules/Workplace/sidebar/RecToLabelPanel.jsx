import { Box, IconButton } from '@mui/material';
import React from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import classes from './index.module.css';
import { useSelector } from 'react-redux';
import Element from './Element';
import useSearchElement from './customHooks/useSearchElement';
import useLabelState from './customHooks/useLabelState';

const RecToLabelPanel = ({ handleDrawerClose, updateMainLabelState, updateLabelState }) => {

    const workspace = useSelector(state => state.workspace)
    let newRecLabelState = { ...workspace.recommendToLabelState }
    const currRecLabelState = workspace.recommendToLabelState
    const { handlePosLabelState, handleNegLabelState } = useLabelState(newRecLabelState, updateMainLabelState, updateLabelState)
    const { handleSearchPanelClick, searchInput } = useSearchElement()

    return (
        <Box>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItem: 'center', marginTop: 3, borderBottom: "1px solid #e2e2e2", pb: 2 }} >
                <IconButton onClick={handleDrawerClose} style={{
                    background: 'none',
                    borderRadius: 0
                }}>
                    <ChevronLeftIcon />
                </IconButton>
                <p style={{ width: '100%', textAlign: "center", marginRight: "40px" }}><strong>Recommend to label</strong></p>
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