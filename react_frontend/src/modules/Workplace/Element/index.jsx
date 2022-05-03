import * as React from 'react';
import { Box } from "@mui/system";
import { Typography } from "@mui/material";
import Stack from '@mui/material/Stack';
import { IconButton } from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import { useDispatch, useSelector } from 'react-redux';
import { setElementLabel, getElementToLabel, setFocusedState, checkStatus, setLabelState } from '../DataSlice'
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
        outline: "None",
        alignItems: 'flex-start',
        flexDirection: 'row',
        marginBottom: 8,
        background: '#D3D3D3',
        fontWeight: 'bold',
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

    const { keyEventHandler, focusedState, index, numLabel, numLabelHandler, clickEventHandler, text, element_id, prediction } = props

    React.useEffect(()=> {
        console.log(`id: ${element_id}`)
    }, [prediction, focusedState])
    
    const dispatch = useDispatch()

    const workspace = useSelector(state => state.workspace)

    const classes = useStyles()

    return (
        <Box sx={{ flexDirection: 'row' }}>
            <Box tabIndex="-1"  onMouseOver={() => dispatch(setFocusedState(index))} className={ focusedState['L' + index] == true ? classes.focused : workspace.labelState['L' + index] != '' ? classes.normal : prediction[index] ? classes.predicted : classes.normal } onKeyDown={keyEventHandler} id={"L" + index} onClick={(e) => clickEventHandler(e, index)}>
                {
                    focusedState['L' + index] != true ? 
                    <Typography paragraph style={( workspace.labelState['L' + index] == 'pos') ? { color: "blue" } : (workspace.labelState['L' + index] == 'neg') ? { color: "red" } : (workspace.labelState['L' + index] == 'ques') ? { color: "#fb8500" } : {}}>
                        {text}
                    </Typography> 
                    :
                    <Typography paragraph style={( workspace.labelState['L' + index] == 'pos') ? { color: "blue" } : (workspace.labelState['L' + index] == 'neg') ? { color: "red" } : (workspace.labelState['L' + index] == 'ques') ? { color: "#fb8500" } : {}}>
                        <strong>{text}</strong>
                    </Typography> 
                }

                { workspace.curCategory != null &&
                    <Stack direction="row" spacing={0} sx={{ justifyContent: "flex-end", marginBottom: 0 }}>
                        { (['pos'].includes(workspace.labelState['L' + index]) || ( workspace.labelState['L' + index] == '' && prediction[index] == true ) || (focusedState['L' + index] == true) ) && <IconButton onClick={() => {
                            var newState = { ...workspace.labelState }

                            if (newState['L' + index] != "pos") {
                                if (newState['L' + index] == "neg") {
                                    numLabelHandler({ "pos": numLabel['pos'] + 1, "neg": numLabel['neg'] - 1 })
                                } else {
                                    numLabelHandler({ ...numLabel, "pos": numLabel['pos'] + 1 })
                                }
                                newState['L' + index] = "pos"
                            } else {
                                numLabelHandler({ ...numLabel, "pos": numLabel['pos'] - 1 })
                                newState['L' + index] = ""
                            }


                            dispatch(setLabelState(newState))

                            dispatch(setElementLabel({ element_id: element_id, docid: workspace.curDocName, label: "true" })).then(() => {
                                dispatch(checkStatus())
                            })
                        }}>
                            <CheckIcon className={ ['', 'pos'].includes(workspace.labelState['L' + index]) ? classes.checkicon : classes.checkicon_predicted} />
                        </IconButton> }
                        { ( ['neg'].includes(workspace.labelState['L' + index]) || focusedState['L' + index] == true ) && <IconButton onClick={() => {
                            var newState = { ...workspace.labelState }
                            if (newState['L' + index] != "neg") {
                                if (newState['L' + index] == "pos") {
                                    numLabelHandler({ "pos": numLabel['pos'] - 1, "neg": numLabel['neg'] + 1 })
                                } else {
                                    numLabelHandler({ ...numLabel, "neg": numLabel['neg'] + 1 })
                                }
                                newState['L' + index] = "neg"
                            } else {
                                numLabelHandler({ ...numLabel, "neg": numLabel['neg'] - 1 })
                                newState['L' + index] = ""
                            }

                            dispatch(setLabelState(newState))

                            dispatch(setElementLabel({ element_id: element_id, docid: workspace.curDocName, label: "false" })).then(() => {
                                dispatch(checkStatus())
                            })
                        }}>
                            <CloseIcon className={ classes.crossicon } />
                        </IconButton> }
                        {
                            ( ['ques'].includes(workspace.labelState['L' + index]) || focusedState['L' + index] == true ) && 
                            <IconButton onClick={() => {
                                var newState = { ...workspace.labelState }

                                if (newState['L' + index] != "ques") {
                                    newState['L' + index] = "ques"
                                } else {
                                    newState['L' + index] = ''
                                }

                                dispatch(setLabelState(newState))
                            }}>
                                <QuestionMarkIcon className={classes.questionicon} />
                            </IconButton>
                        }
                    </Stack>
                }
            </Box>
        </Box>

    );
}