import * as React from 'react';
import Highlighter from "react-highlight-words";
import Paper from '@mui/material/Paper';
import CloseIcon from '@mui/icons-material/Close';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import CheckIcon from '@mui/icons-material/Check';
import IconButton from "@mui/material/IconButton";
import Stack from '@mui/material/Stack';
import { Typography } from "@mui/material";
import { setFocusedState, fetchCertainDocument, checkStatus, setElementLabel, getElementToLabel } from '../DataSlice.jsx';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from '@mui/styles';
import { styled, useTheme } from '@mui/material/styles';
import { useState } from "react";

import checking from './../Asset/checking.svg'
import check from './../Asset/check.svg'
import check_predict from './../Asset/check_predict.svg'
import crossing from './../Asset/crossing.svg'
import cross from './../Asset/cross.svg'
import questioning from './../Asset/questioning.svg'
import question from './../Asset/question.svg'

const useStyles = makeStyles((theme) => ({
    checkicon: {
        color: "rgba(0, 255, 0)"
    },
    checkicon_predicted: {
        color: "rgba(0, 255, 0, 0.7)",
    },
    crossicon: {
        color: "rgba(255, 0, 0)"
    },
    crossicon_predicted: {
        color: "rgba(255, 0, 0, 0.7)",
    },
    questionicon: {
        color: "#fb8500"
    },
    predicted_true: {
        border: "medium dotted",
        borderColor: "green",
        outline: "None",
        justifyContent: 'center',
        cursor: "pointer",
        padding: 10, 
        marginTop: 25, 
        marginLeft: 50, 
        marginRight: 50
    }, 
    predicted_false: {
        border: "medium dotted",
        borderColor: "red",
        outline: "None",
        cursor: "pointer",
        padding: 10, 
        marginTop: 25, 
        marginLeft: 50, 
        marginRight: 50
    }, 
    normal: {
        border: "medium solid",
        borderColor: "white",
        outline: "None",
        cursor: "pointer",
        padding: 10, 
        marginTop: 25, 
        marginLeft: 50, 
        marginRight: 50
    }
}));

export default function SearchPanel(props) {

    const { text, searchInput, docid, id ,numLabel, numLabelHandler, element_id, prediction } = props

    const workspace = useSelector(state => state.workspace)

    const splits = element_id.split("-")

    const index = parseInt(splits[splits.length-1])

    const dispatch = useDispatch();

    const [ labelState, setLabelState ] = useState("")

    const classes = useStyles()

    React.useEffect(() => {
        console.log('prediction: ', prediction)
    }, [prediction])

    const handleSearchPanelClick = (docid, eid) => {
    
        console.log(`eid: ${eid}`)

        const splits = element_id.split("-")

        const index = parseInt(splits[splits.length-1])
        
        if (docid != workspace.curDocId) {
          dispatch(fetchCertainDocument({ docid, eid })).then(() => {
            dispatch(setFocusedState(index))
          })
        } else {
          dispatch(setFocusedState(index))
        }
    
      }

      console.log(labelState);

    return (
        <Paper labelState={labelState} className="text_confused" onClick={() => handleSearchPanelClick(docid, id)}>
            
            <label>{docid}</label>
            <p>
            <Highlighter 
                searchWords={[searchInput]}
                autoEscape={true}
                textToHighlight={text}
                unhighlightTag={"p"}
            />
            </p>

            <Stack className="recommend_buttons" direction="row" spacing={0} sx={{ justifyContent: "flex-end", marginBottom: 0 }}>
                { ['', 'pos'].includes(labelState) && <IconButton onClick={() => {

                            var newState = labelState

                            if (newState != "pos") {
                                if (newState == "neg") {
                                    numLabelHandler({ "pos": numLabel['pos'] + 1, "neg": numLabel['neg'] - 1 })
                                } else {
                                    numLabelHandler({ ...numLabel, "pos": numLabel['pos'] + 1 })
                                }
                                newState = "pos"
                            } else {
                                numLabelHandler({ ...numLabel, "pos": numLabel['pos'] - 1 })
                                newState = ""
                            }

                            setLabelState(newState)

                            dispatch(setElementLabel({ element_id: element_id, docid: docid, label: "true" })).then(() => {
                                dispatch(checkStatus())
                            })

                            document.getElementById('L'+index).scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                                // inline: "nearest"
                              })
                        }}>
                            { labelState == 'pos' ?
                                <img src={check} alt="checked"/>
                                : <img src={checking} alt="checking"/>
                            }

                        </IconButton> }
                        { ['', 'neg'].includes(labelState) && <IconButton onClick={() => {
                            var newState = labelState
                            if (newState != "neg") {
                                if (newState == "pos") {
                                    numLabelHandler({ "pos": numLabel['pos'] - 1, "neg": numLabel['neg'] + 1 })
                                } else {
                                    numLabelHandler({ ...numLabel, "neg": numLabel['neg'] + 1 })
                                }
                                newState = "neg"
                            } else {
                                numLabelHandler({ ...numLabel, "neg": numLabel['neg'] - 1 })
                                newState = ""
                            }

                            setLabelState(newState)

                            dispatch(setElementLabel({ element_id: element_id, docid: docid, label: "false" })).then(() => {
                                dispatch(checkStatus())
                            })

                            document.getElementById('L'+index).scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                                // inline: "nearest"
                              })
                        }}>
                            { labelState == 'neg' ?
                                <img src={cross} alt="crossed"/>
                                : <img src={crossing} alt="crossing"/>
                            }

                        </IconButton> }
                        {
                            ['', 'ques'].includes(labelState) && 
                            <IconButton onClick={() => {
                                var newState = labelState

                                if (newState != "ques") {
                                    newState = "ques"
                                } else {
                                    newState = ''
                                }

                                setLabelState(newState)

                                document.getElementById('L'+index).scrollIntoView({
                                    behavior: "smooth",
                                    block: "start",
                                    // inline: "nearest"
                                  })
                            }}>
                                { labelState == 'ques' ?
                                <img src={question} alt="questioned"/>
                                : <img src={questioning} alt="questioning"/>
                                }

                            </IconButton>
                        }
            </Stack>
        </Paper>

    )
}