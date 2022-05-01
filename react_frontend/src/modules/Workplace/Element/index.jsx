import * as React from 'react';
import { Box } from "@mui/system";
import { Typography } from "@mui/material";
import Stack from '@mui/material/Stack';
import { IconButton } from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import { useDispatch, useSelector } from 'react-redux';
import { setElementLabel, getElementToLabel, setFocusedState, setLabelState } from '../DataSlice'
import CloseIcon from '@mui/icons-material/Close';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import { styled, useTheme } from '@mui/material/styles';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import { makeStyles } from '@mui/styles';

const Line = styled(Box)((props) => ({
    ...(props.focused == true ? {
        border: "thin solid",
        borderColor: "#f48c06"
    } : ((props.prediction == true) ? 
    {
        border: "thin solid",
        borderColor: "#76c893"
    } : 
    {
        border: "thin solid",
        borderColor: "white"
    })),
    outline: "None",
    alignItems: 'flex-start',
    flexDirection: 'row',
    display: 'flex',
    justifyContent: 'center',
    padding: "10px 25px",
    cursor: "pointer",
}))

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
    focused: {
        border: "medium solid",
        borderColor: "#f48c06",
        outline: "None",
        alignItems: 'flex-start',
        flexDirection: 'row',
        marginBottom: 8,
        display: 'flex',
        justifyContent: 'center',
        padding: "10px 25px",
        cursor: "pointer"
    },
    predicted: {
        border: "medium dotted",
        borderColor: "green",
        outline: "None",
        alignItems: 'flex-start',
        flexDirection: 'row',
        marginBottom: 8,
        display: 'flex',
        justifyContent: 'center',
        padding: "10px 25px",
        cursor: "pointer"
    }, 
    normal: {
        border: "medium solid",
        borderColor: "white",
        outline: "None",
        alignItems: 'flex-start',
        flexDirection: 'row',
        marginBottom: 8,
        display: 'flex',
        justifyContent: 'center',
        padding: "10px 25px",
        cursor: "pointer"
    }
}));

export default function Sentence(props) {

    const { keyEventHandler, focusedState, id, numLabel, numLabelHandler, clickEventHandler, text, element_id, prediction } = props

    React.useEffect(()=> {
        console.log(`id: ${element_id}, prediction: ${prediction}`)
    }, [prediction, focusedState])
    
    const dispatch = useDispatch()

    const workspace = useSelector(state => state.workspace)

    const classes = useStyles()

    return (
        <Box sx={{ flexDirection: 'row' }}>
            { (prediction.length > 0)  && 
            <Box tabIndex="-1" className={ focusedState['L' + id] == true ? classes.focused : workspace.labelState['L' + id] != '' ? classes.normal : prediction[id] ? classes.predicted : classes.normal } onKeyDown={keyEventHandler} id={"L" + id} onClick={(e) => clickEventHandler(e, id)}>

                <Typography paragraph style={(workspace.labelState['L' + id] == 'pos') ? { color: "blue" } : (workspace.labelState['L' + id] == 'neg') ? { color: "red" } : (workspace.labelState['L' + id] == 'ques') ? { color: "#fb8500" } : {}}>
                    {text}
                </Typography>

                {/* { (focusedState['L' + id] == true || prediction[id] == true) && */}
                    <Stack direction="row" spacing={0} sx={{ justifyContent: "flex-end", marginBottom: 0 }}>
                        { (['pos'].includes(workspace.labelState['L' + id]) || ( workspace.labelState['L' + id] == '' && prediction[id] == true ) || (focusedState['L' + id] == true) ) && <IconButton onClick={() => {
                            var newState = { ...workspace.labelState }

                            if (newState['L' + id] != "pos") {
                                if (newState['L' + id] == "neg") {
                                    numLabelHandler({ "pos": numLabel['pos'] + 1, "neg": numLabel['neg'] - 1 })
                                } else {
                                    numLabelHandler({ ...numLabel, "pos": numLabel['pos'] + 1 })
                                }
                                newState['L' + id] = "pos"
                            } else {
                                numLabelHandler({ ...numLabel, "pos": numLabel['pos'] - 1 })
                                newState['L' + id] = ""
                            }


                            dispatch(setLabelState(newState))

                            dispatch(setElementLabel({ element_id: element_id, docid: workspace.curDocName, label: "true" })).then(() => {
                                if (workspace.num_cur_batch == 10) {
                                    dispatch(getElementToLabel())
                                }
                            })
                        }}>
                            <CheckIcon className={ ['', 'pos'].includes(workspace.labelState['L' + id]) ? classes.checkicon : classes.checkicon_predicted} />
                        </IconButton> }
                        { ( ['neg'].includes(workspace.labelState['L' + id]) || focusedState['L' + id] == true ) && <IconButton onClick={() => {
                            var newState = { ...workspace.labelState }
                            if (newState['L' + id] != "neg") {
                                if (newState['L' + id] == "pos") {
                                    numLabelHandler({ "pos": numLabel['pos'] - 1, "neg": numLabel['neg'] + 1 })
                                } else {
                                    numLabelHandler({ ...numLabel, "neg": numLabel['neg'] + 1 })
                                }
                                newState['L' + id] = "neg"
                            } else {
                                numLabelHandler({ ...numLabel, "neg": numLabel['neg'] - 1 })
                                newState['L' + id] = ""
                            }

                            dispatch(setLabelState(newState))

                            dispatch(setElementLabel({ element_id: element_id, docid: workspace.curDocName, label: "false" })).then(() => {
                                if (workspace.num_cur_batch == 10) {
                                    dispatch(getElementToLabel())
                                }
                            })
                        }}>
                            <CloseIcon className={ classes.crossicon } />
                        </IconButton> }
                        {
                            ( ['ques'].includes(workspace.labelState['L' + id]) || focusedState['L' + id] == true ) && 
                            <IconButton onClick={() => {
                                var newState = { ...workspace.labelState }

                                if (newState['L' + id] != "ques") {
                                    newState['L' + id] = "ques"
                                } else {
                                    newState['L' + id] = ''
                                }

                                dispatch(setLabelState(newState))
                            }}>
                                <QuestionMarkIcon className={classes.questionicon} />
                            </IconButton>
                        }
                    </Stack>
                {/* } */}
            </Box>
        }
        </Box>

    );
}