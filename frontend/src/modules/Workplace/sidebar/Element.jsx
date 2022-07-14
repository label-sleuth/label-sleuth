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

import Highlighter from "react-highlight-words";
import Paper from '@mui/material/Paper';
import IconButton from "@mui/material/IconButton";
import Stack from '@mui/material/Stack';
import check from '../Asset/check.svg';
import checking from '../Asset/checking.svg';
import crossing from '../Asset/crossing.svg';
import cross from '../Asset/cross.svg';
import classes from './index.module.css';
import PanelStyles from './PanelStyles';
import { Box } from '@mui/material';
import { useSelector } from "react-redux";
import { SEARCH } from "../../../const";

export default function Element(props) {

    const {
        text,
        searchInput,
        docid,
        id,
        prediction,
        handleSearchPanelClick,
        handlePosLabelState,
        handleNegLabelState,
        searchedIndex,
        labelState
    } = props

    const { text_colors, handleTextElemStyle } = PanelStyles(prediction)
    const searchedElemIndex = `L${searchedIndex}-${id}`
    const workspace = useSelector(state => state.workspace)

    return (
        <Paper onClick={()=> handleSearchPanelClick(docid, id)}
            className={handleTextElemStyle()}
            sx={{ padding: '0 !important', mb: 2, ml: 1, mr: 0 }}
            style={{ cursor: "pointer" }}
        >
            <label style={{ cursor: "pointer" }} className={prediction == "true"? classes["pred_rec_doc_id"] : classes["rec_doc_id"]}>{docid}</label>
            <Box >
                <p docid={docid} id={id} className={classes["elem_text"]} style={(text_colors[labelState[searchedElemIndex]])}>
                    <Highlighter
                        searchWords={workspace.activePanel === SEARCH ? [searchInput] : []}
                        autoEscape={false}
                        textToHighlight={text}
                    />
                </p>
            </Box>
            <Stack id={id} searchedindex={searchedIndex} className={classes["recommend_buttons"]}
                direction="row" spacing={0} sx={{ justifyContent: "flex-end", marginBottom: 0, height: "25px", mr: 1, mb: 1 }}>
                {workspace.curCategory !== null &&
                    <>
                        <div className={classes.resultbtn}
                            onClick={(e) => { e.stopPropagation(); handlePosLabelState(docid, id, searchedIndex)}}>
                            {labelState[searchedElemIndex] == 'pos' ?
                                <img src={check} alt="checked" /> :
                                <img className={classes.hovbtn} src={checking} alt="checking" />
                            }
                        </div>
                        <div className={classes.resultbtn} positiveicon="false" onClick={(e) => {e.stopPropagation(); handleNegLabelState(docid, id, searchedIndex)}}>
                            {labelState[searchedElemIndex] == 'neg' ?
                                <img src={cross} alt="crossed" /> :
                                <img className={classes.hovbtn} src={crossing} alt="crossinging" />
                            }
                        </div>
                    </>
                }
            </Stack>
        </Paper>
    )
}