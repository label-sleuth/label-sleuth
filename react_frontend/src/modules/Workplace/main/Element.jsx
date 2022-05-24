import * as React from 'react';
import { Box } from "@mui/system";
import Stack from '@mui/material/Stack';
import { IconButton } from "@mui/material";
import { useDispatch, useSelector } from 'react-redux';
import { setElementLabel, setFocusedState, checkStatus, setLabelState, increaseIdInBatch } from '../DataSlice';
import checking from '../Asset/checking.svg';
import check from '../Asset/check.svg';
import check_predict from '../Asset/check_predict.svg';
import crossing from '../Asset/crossing.svg';
import cross from '../Asset/cross.svg';
import questioning from '../Asset/questioning.svg';
import question from '../Asset/question.svg';
import none from '../Asset/none.svg';
import classes from './Element.module.css';

const text_colors = {
    'pos': { color: '#3092ab' },
    'neg': { color: '#bd3951' },
    'ques': { color: '#cfae44' }
}


export default function Sentence(props) {
    const dispatch = useDispatch()
    const { numOfElemPerPage, searchedItemIndex, keyEventHandler, focusedState, numLabelGlobal, numLabelGlobalHandler, index, numLabel, numLabelHandler, clickEventHandler, text, element_id, prediction } = props
    const workspace = useSelector(state => state.workspace)

    React.useEffect(() => {
        console.log(`prediction updated, element id: ${element_id}`)
    }, [prediction, element_id])

    let mainElemStyle = classes["text_normal"]

    const handleMainElemStyle = () => {

        if ((workspace["focusedIndex"] == index
        ) || ((searchedItemIndex % numOfElemPerPage) == index
            )) {
            mainElemStyle = classes["text_focus"]
        }
        else if (prediction[index]) {
            mainElemStyle = classes["text_predict"]
        }
        else {
            mainElemStyle = classes["text_normal"]
        }
        return mainElemStyle
    }


    if (workspace.curCategory == null) {
        return (
            <Box tabIndex="-1" className={classes["text_normal"]}>
                <p className={classes["nodata_text"]}>{text}</p>
            </Box>
        )
    } else {
        return (
            <Box tabIndex="-1"
                className={handleMainElemStyle()}
                id={"L" + index}  >
                <p className={classes.data_text} style={(text_colors[workspace.labelState['L' + index]])}>{text}</p>

                <Stack
                    className={classes.checking_buttons}
                    direction="row"
                    spacing={0}
                >
                    <IconButton
                        onClick={() => {
                            var newState = { ...workspace.labelState }

                            if (newState['L' + index] != "pos") {
                                if (newState['L' + index] == "neg") {
                                    numLabelHandler({ "pos": numLabel['pos'] + 1, "neg": numLabel['neg'] - 1 })
                                    numLabelGlobalHandler({ "pos": numLabelGlobal['pos'] + 1, "neg": numLabelGlobal['neg'] - 1 })
                                } else {
                                    numLabelHandler({ ...numLabel, "pos": numLabel['pos'] + 1 })
                                    numLabelGlobalHandler({ ...numLabelGlobal, "pos": numLabelGlobal['pos'] + 1 })
                                }
                                newState['L' + index] = "pos"

                                dispatch(increaseIdInBatch())

                                dispatch(setElementLabel({ element_id: element_id, docid: workspace.curDocName, label: "true" })).then(() => {
                                    dispatch(checkStatus())
                                })

                            } else {
                                numLabelHandler({ ...numLabel, "pos": numLabel['pos'] - 1 })
                                numLabelGlobalHandler({ ...numLabelGlobal, "pos": numLabelGlobal['pos'] - 1 })
                                newState['L' + index] = ""
                            }

                            dispatch(setLabelState(newState))

                        }}>
                        {workspace.labelState['L' + index] == 'pos' ?
                            <img className={classes.resultbtn} src={check} alt="checked" /> :
                            prediction[index] == true && workspace.labelState['L' + index] !== 'neg' && workspace.labelState['L' + index] !== 'ques' ?
                                <img className={classes.resultbtn} src={check_predict} alt="predicted checking" /> :
                                <img className={classes.hovbtn} src={checking} alt="checking" />
                        }

                    </IconButton>
                    <IconButton onClick={() => {
                        var newState = { ...workspace.labelState }
                        if (newState['L' + index] != "neg") {
                            if (newState['L' + index] == "pos") {
                                numLabelHandler({ "pos": numLabel['pos'] - 1, "neg": numLabel['neg'] + 1 })
                                numLabelGlobalHandler({ "pos": numLabelGlobal['pos'] - 1, "neg": numLabelGlobal['neg'] + 1 })
                            } else {
                                numLabelHandler({ ...numLabel, "neg": numLabel['neg'] + 1 })
                                numLabelGlobalHandler({ ...numLabelGlobal, "neg": numLabelGlobal['neg'] + 1 })
                            }
                            newState['L' + index] = "neg"

                            dispatch(increaseIdInBatch())

                            dispatch(setElementLabel({ element_id: element_id, docid: workspace.curDocName, label: "false" })).then(() => {
                                dispatch(checkStatus())
                            })

                        } else {
                            numLabelHandler({ ...numLabel, "neg": numLabel['neg'] - 1 })
                            numLabelGlobalHandler({ ...numLabelGlobal, "neg": numLabelGlobal['neg'] - 1 })
                            newState['L' + index] = ""
                        }

                        dispatch(setLabelState(newState))

                    }}>
                        {workspace.labelState['L' + index] == 'neg' ?
                            <img className={classes.resultbtn} src={cross} alt="crossed" /> :
                            <img className={classes.hovbtn} src={crossing} alt="crossinging" />
                        }

                    </IconButton>
                    <IconButton onClick={() => {
                        var newState = { ...workspace.labelState }

                        if (newState['L' + index] != "ques") {
                            newState['L' + index] = "ques"
                        } else {
                            newState['L' + index] = ''
                        }

                        dispatch(setLabelState(newState))
                    }}>
                        {workspace.labelState['L' + index] == 'ques' ?
                            <img className={classes.resultbtn} src={question} alt="questioned" /> :
                            <img className={classes.hovbtn} src={questioning} alt="questioning" />
                        }
                    </IconButton>

                </Stack>

            </Box>
        )
    }
}