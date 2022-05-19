import * as React from 'react';
import { Box } from "@mui/system";
import Stack from '@mui/material/Stack';
import { IconButton } from "@mui/material";
import { useDispatch, useSelector } from 'react-redux';
import { setElementLabel, setFocusedState, checkStatus, setLabelState, increaseIdInBatch } from '../DataSlice'
import checking from '../Asset/checking.svg'
import check from '../Asset/check.svg'
import check_predict from '../Asset/check_predict.svg'
import crossing from '../Asset/crossing.svg'
import cross from '../Asset/cross.svg'
import questioning from '../Asset/questioning.svg'
import question from '../Asset/question.svg'
 
const text_colors = {
    'pos': { color: '#3092ab' },
    'neg': { color: '#bd3951' },
    'ques': { color: '#cfae44' }
}



export default function Sentence(props) {
    const dispatch = useDispatch()
    const { numOfElemPerPage, searchedItemIndex, keyEventHandler, focusedState, numLabelGlobal, numLabelGlobalHandler, index, numLabel, numLabelHandler, clickEventHandler, text, element_id, prediction } = props

    React.useEffect(() => {
        console.log(`prediction updated, element id: ${element_id}`)
    }, [prediction, element_id])


    const workspace = useSelector(state => state.workspace)

    if (workspace.curCategory == null) {
        return (
            <Box tabIndex="-1" onMouseOver={() => dispatch(setFocusedState(index))} className=  "text_normal"   onKeyDown={keyEventHandler} id={"L" + index} onClick={(e) => clickEventHandler(e, index)}>
                <p className="nodata_text" style={(text_colors[workspace.labelState['L' + index]])}>{text}</p>
            </Box>
        )
    } else {
        return (
            <Box tabIndex="-1" 
            onMouseOver={() => dispatch(setFocusedState(index))}
             className={((workspace["focusedIndex"] == index) || ((searchedItemIndex % numOfElemPerPage) == index)) ? "text_focus" :  prediction[index] ? "text_predict" : "text_normal"}
              onKeyDown={keyEventHandler} id={"L" + index} onClick={(e) => clickEventHandler(e, index)}>
                <p className="data_text" style={(text_colors[workspace.labelState['L' + index]])}>{text}</p>

                <Stack className="checking_buttons" direction="row" spacing={0} sx={{ justifyContent: "flex-end", marginBottom: 0 }}>
                    {(['pos'].includes(workspace.labelState['L' + index]) || (workspace.labelState['L' + index] == '' && prediction[index] == true) || (focusedState['L' + index] == true)) && <IconButton onClick={() => {
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

                        {workspace.focusedIndex == index ?
                            <img src={checking} alt="checking" />
                            : workspace.labelState['L' + index] == 'pos' ?
                                <img src={check} alt="checked" />
                                : <img src={check_predict} alt="predicted checking" />
                        }

                    </IconButton>}
                    {(['neg'].includes(workspace.labelState['L' + index]) || focusedState['L' + index] == true) && <IconButton onClick={() => {
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
                        {workspace.focusedIndex == index ?
                            <img src={crossing} alt="crossinging" />
                            : <img src={cross} alt="crossed" />
                        }

                    </IconButton>}
                    {
                        (['ques'].includes(workspace.labelState['L' + index]) || focusedState['L' + index] == true) &&
                        <IconButton onClick={() => {
                            var newState = { ...workspace.labelState }

                            if (newState['L' + index] != "ques") {
                                newState['L' + index] = "ques"
                            } else {
                                newState['L' + index] = ''
                            }

                            dispatch(setLabelState(newState))
                        }}>
                            {workspace.focusedIndex == index ?
                                <img src={questioning} alt="questioning" />
                                : <img src={question} alt="questioned" />
                            }

                        </IconButton>
                    }
                </Stack>

            </Box>
        )
    }
}