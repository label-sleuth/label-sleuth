import * as React from 'react';
import Highlighter from "react-highlight-words";
import Paper from '@mui/material/Paper';
import IconButton from "@mui/material/IconButton";
import Stack from '@mui/material/Stack';
import { useSelector } from 'react-redux';
import check from '../Asset/check.svg';
import checking from '../Asset/checking.svg';
import crossing from '../Asset/crossing.svg';
import cross from '../Asset/cross.svg';
import classes from './SearchPanel.module.css';
import useSearchPanelStyles from './customHooks/useSearchPanelStyles';
import check_predict from '../Asset/check_predict.svg';

export default function SearchPanel(props) {

    const { text, searchInput, docid, id, prediction, handleSearchPanelClick, handlePosLabelState, handleNegLabelState, searchedIndex } = props
    const searchPanelLabelState = useSelector(state => state.workspace.searchPanelLabelState)
    const { text_colors, handleTextElemStyle } = useSearchPanelStyles(prediction)

    return (
        <Paper
            className={handleTextElemStyle()}
            sx={{ cursor: "pointer", padding: '0 !important', mb: 2, ml: 1, mr: 0 }}
            onClick={handleSearchPanelClick}
        >
            <label className={classes["rec_doc_id"]}>{docid}</label>
            <p docid={docid} id={id} className={classes["elem_text"]} style={(text_colors[searchPanelLabelState['L' + searchedIndex + '-' + id]])}>
                <Highlighter
                    searchWords={[searchInput]}
                    autoEscape={true}
                    textToHighlight={text}
                />
            </p>
            <Stack id={id} searchedindex={searchedIndex} className={classes["recommend_buttons"]} direction="row" spacing={0} sx={{ justifyContent: "flex-end", marginBottom: 0, height: "25px", mr: 1, mb: 1 }}>
                <IconButton className={classes.resultbtn} 
                    onClick={handlePosLabelState}>
                    {searchPanelLabelState['L' + searchedIndex + '-' + id] == 'pos' ?
                        <img src={check} alt="checked" /> :
                        prediction == 'true' && searchPanelLabelState['L' + searchedIndex + '-' + id] !== 'neg' ?
                            <img src={check_predict} alt="predicted checking" /> :
                            <img className={classes.hovbtn} src={checking} alt="checking" />
                    }
                </IconButton>
                <IconButton className={classes.resultbtn}  positiveicon="false" onClick={handleNegLabelState}>
                    {searchPanelLabelState['L' + searchedIndex + '-' + id] == 'neg' ?
                        <img src={cross} alt="crossed" /> :
                        <img className={classes.hovbtn} src={crossing} alt="crossinging" />
                    }
                </IconButton>
            </Stack>
        </Paper>
    )
}