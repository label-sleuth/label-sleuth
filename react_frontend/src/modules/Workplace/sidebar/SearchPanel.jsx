import * as React from 'react';
import Highlighter from "react-highlight-words";
import Paper from '@mui/material/Paper';
import IconButton from "@mui/material/IconButton";
import Stack from '@mui/material/Stack';
import { setFocusedState, fetchCertainDocument, setLabelState, checkStatus, setElementLabel, increaseIdInBatch } from '../DataSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from "react";
import check from '../Asset/check.svg';
import checking from '../Asset/checking.svg';
import crossing from '../Asset/crossing.svg';
import cross from '../Asset/cross.svg';
import questioning from '../Asset/questioning.svg';
import question from '../Asset/question.svg';
import classes from './SearchPanel.module.css';


export default function SearchPanel(props) {

    const { text, searchInput, docid, id ,numLabel, numLabelHandler, numLabelGlobal, numLabelGlobalHandler, element_id, prediction, handleSearchPanelClick } = props
    const workspace = useSelector(state => state.workspace)
    const splits = element_id.split("-")
    const index = parseInt(splits[splits.length-1])
    const dispatch = useDispatch();
    const [ labelState, setLocalLabelState ] = useState("")

    React.useEffect(() => {
        console.log('prediction: ', prediction)
    }, [prediction])

    return (
        <Paper 
            labelState={labelState}
            className={classes["text_confused"]}
            sx={{ cursor: "pointer" }}
            onClick={(e) => {
               handleSearchPanelClick(docid, id)
            }}
        >
            <label className={classes["rec_doc_id"]}>{docid}</label>
            <p>
            <Highlighter 
                searchWords={[searchInput]}
                autoEscape={true}
                textToHighlight={text}
                unhighlightTag={"p"}
            />
            </p>

            <Stack className="recommend_buttons" direction="row" spacing={0} sx={{ justifyContent: "flex-end", marginBottom: 0 }}>
                { ['', 'pos'].includes(labelState) && <IconButton onClick={(e) => {

                            e.stopPropagation()
                            
                            var newState = labelState

                            if (newState != "pos") {
                                if (newState == "neg") {
                                    numLabelHandler({ "pos": numLabel['pos'] + 1, "neg": numLabel['neg'] - 1 })
                                    numLabelGlobalHandler({ "pos": numLabelGlobal['pos'] + 1, "neg": numLabelGlobal['neg'] - 1 })
                                } else {
                                    numLabelHandler({ ...numLabel, "pos": numLabel['pos'] + 1 })
                                    numLabelGlobalHandler({ ...numLabelGlobal, "pos": numLabelGlobal['pos'] + 1})
                                }
                                newState = "pos"

                                dispatch(increaseIdInBatch())

                                dispatch(setElementLabel({ element_id: element_id, docid: docid, label: "true" })).then(() => {
                                    dispatch(checkStatus())
                                })
                            } else {
                                numLabelHandler({ ...numLabel, "pos": numLabel['pos'] - 1 })
                                numLabelGlobalHandler({...numLabelGlobal, "pos": numLabelGlobal['pos'] - 1})
                                newState = ""
                            }

                            setLocalLabelState(newState)

                            if ( workspace['curDocName'] != docid ) {
                                var initialLabelState = {}

                                for (var i = 0; i < workspace['elements'].length; i++) {
                                    initialLabelState['L'+i] = ""
                                }

                                initialLabelState['L' + index] = newState

                                dispatch(setLabelState(initialLabelState))
                            } else {
                                var initialLabelState = { ...workspace.labelState }

                                initialLabelState['L' + index] = newState

                                dispatch(setLabelState(initialLabelState))
                            }



                            if (docid != workspace.curDocName) {
                                dispatch(fetchCertainDocument({ docid, id, switchStatus: "search" })).then(() => {
                                  dispatch(setFocusedState(index))
                                })
                              } else {
                                dispatch(setFocusedState(index))
                              }

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
                        { ['', 'neg'].includes(labelState) && <IconButton onClick={(e) => {
                            e.stopPropagation()

                            var newState = labelState
                            if (newState != "neg") {
                                if (newState == "pos") {
                                    numLabelHandler({ "pos": numLabel['pos'] - 1, "neg": numLabel['neg'] + 1 })
                                    numLabelGlobalHandler({ "pos": numLabelGlobal['pos'] - 1, "neg": numLabelGlobal['neg'] + 1 })
                                } else {
                                    numLabelHandler({ ...numLabel, "neg": numLabel['neg'] + 1 })
                                    numLabelGlobalHandler({...numLabelGlobal, "neg": numLabelGlobal['neg'] + 1})
                                }
                                newState = "neg"

                                dispatch(increaseIdInBatch())

                                dispatch(setElementLabel({ element_id: element_id, docid: docid, label: "false" })).then(() => {
                                    dispatch(checkStatus())
                                })

                            } else {
                                numLabelHandler({ ...numLabel, "neg": numLabel['neg'] - 1 })
                                numLabelGlobalHandler({...numLabelGlobal, "neg": numLabelGlobal['neg'] - 1})
                                newState = ""
                            }

                            setLocalLabelState(newState)

                            if ( workspace['curDocName'] != docid ) {
                                var initialLabelState = {}

                                for (var i = 0; i < workspace['elements'].length; i++) {
                                    initialLabelState['L'+i] = ""
                                }

                                initialLabelState['L' + index] = newState

                                dispatch(setLabelState(initialLabelState))
                            } else {
                                var initialLabelState = { ...workspace.labelState }

                                initialLabelState['L' + index] = newState

                                dispatch(setLabelState(initialLabelState))
                            }

                            if (docid != workspace.curDocName) {
                                dispatch(fetchCertainDocument({ docid, id, switchStatus: "search" })).then(() => {
                                  dispatch(setFocusedState(index))
                                })
                              } else {
                                dispatch(setFocusedState(index))
                              }

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
                            <IconButton onClick={(e) => {

                                e.stopPropagation()

                                var newState = labelState

                                if (newState != "ques") {
                                    newState = "ques"
                                } else {
                                    newState = ''
                                }

                                setLocalLabelState(newState)

                                if ( workspace['curDocName'] != docid ) {
                                    var initialLabelState = {}
    
                                    for (var i = 0; i < workspace['elements'].length; i++) {
                                        initialLabelState['L'+i] = ""
                                    }
    
                                    initialLabelState['L' + index] = 'ques'
    
                                    dispatch(setLabelState(initialLabelState))
                                } else {
                                    var initialLabelState = { ...workspace.labelState }
    
                                    initialLabelState['L' + index] = 'ques'
    
                                    dispatch(setLabelState(initialLabelState))
                                }

                                if (docid != workspace.curDocName) {
                                    dispatch(fetchCertainDocument({ docid, id, switchStatus: "search" })).then(() => {
                                      dispatch(setFocusedState(index))
                                    })
                                  } else {
                                    dispatch(setFocusedState(index))
                                  }

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