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
import questioning from '../Asset/questioning.svg';
import question from '../Asset/question.svg';
import classes from './SearchPanel.module.css';
import useSearchLabelState from '../sidebar/useSearchLabelState';
import check_predict from '../Asset/check_predict.svg';
export default function SearchPanel(props) {

    const { text, searchInput, docid, id, prediction, handleSearchPanelClick } = props
    const workspace = useSelector(state => state.workspace)
    const { handlePosLabelState, handleNegLabelState, handleQuestLabelState, labelState, index } = useSearchLabelState({ ...props })

    const text_colors = {
        'pos': { color: '#3092ab' },
        'neg': { color: '#bd3951' },
        'ques': { color: '#cfae44' }
    }
    
    React.useEffect(() => {
        console.log('prediction: ', prediction)
    }, [prediction])

    return (
        <Paper
            labelstate={labelState}
            className={classes["text_confused"]}
            sx={{ cursor: "pointer", padding: '0 !important' }}
        >
            <label className={classes["rec_doc_id"]}>{docid}</label>
            <p className={classes["elem_text"]} style={(text_colors[workspace.labelState['L' + index]])} onClick={(e) => {
                handleSearchPanelClick(docid, id)
            }}>
                <Highlighter
                    searchWords={[searchInput]}
                    autoEscape={true}
                    textToHighlight={text}
                />
            </p>
            <Stack className={classes["recommend_buttons"]} direction="row" spacing={0} sx={{ justifyContent: "flex-end", marginBottom: 0, height: "25px", mr: 1, mb: 1 }}>
                <IconButton className={classes.resultbtn}
                    onClick={handlePosLabelState}>
                    {labelState == 'pos' ?
                        <img src={check} alt="checked" /> :
                        prediction && prediction[index] == true && labelState !== 'neg' && labelState !== 'ques' ?
                            <img src={check_predict} alt="predicted checking" /> :
                            <img className={classes.hovbtn} src={checking} alt="checking" />
                    }
                </IconButton>
                <IconButton className={classes.resultbtn} onClick={handleNegLabelState}>
                    {labelState == 'neg' ?
                        <img src={cross} alt="crossed" /> :
                        <img className={classes.hovbtn} src={crossing} alt="crossinging" />
                    }
                </IconButton>
                <IconButton className={classes.resultbtn} onClick={handleQuestLabelState}>
                    {labelState == 'ques' ?
                        <img src={question} alt="questioned" /> :
                        <img className={classes.hovbtn} src={questioning} alt="questioning" />
                    }
                </IconButton>
            </Stack>
        </Paper>
    )
}