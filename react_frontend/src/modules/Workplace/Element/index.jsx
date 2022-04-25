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
    } : {
        border: "thin solid",
        borderColor: "white"
    }),
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
        color: "green"
    },
    crossicon: {
        color: "red"
    },
    questionicon: {
        color: "#fb8500"
    }
}));

export default function Sentence(props) {

    const { keyEventHandler, focusedState, id, numLabel, numLabelHandler, clickEventHandler, text, element_id } = props

    const dispatch = useDispatch()

    const workspace = useSelector(state => state.workspace)

    const classes = useStyles()

    return (
        <Box sx={{ flexDirection: 'row' }}>
            <Line tabIndex="-1" onKeyDown={keyEventHandler} focused={workspace.focusedState['L' + id]} id={"L" + id} onClick={(e) => clickEventHandler(e, id)}>

                <Typography paragraph style={(workspace.labelState['L' + id] == 'pos') ? { color: "blue" } : (workspace.labelState['L' + id] == 'neg') ? { color: "red" } : (workspace.labelState['L' + id] == 'ques') ? { color: "#fb8500" } : {}}>
                    {text}
                </Typography>

                {focusedState['L' + id] == true &&
                    <Stack direction="row" spacing={0} sx={{ justifyContent: "flex-end", marginBottom: 0 }}>
                        <IconButton onClick={() => {
                            var newState = { ...workspace.labelState }

                            if (newState['L' + id] != "pos") {
                                if (newState['L' + id] == "neg") {
                                    numLabelHandler({ "pos": numLabel['pos'] + 1, "neg": numLabel['neg'] - 1 })
                                } else {
                                    numLabelHandler({ ...numLabel, "pos": numLabel['pos'] + 1 })
                                }
                            }
                            console.log(`newState: `, newState)
                            newState['L' + id] = "pos"
                            dispatch(setLabelState(newState))

                            dispatch(setElementLabel({ element_id: element_id, label: "true" })).then(() => {
                                if (workspace.num_cur_batch == 10) {
                                    dispatch(getElementToLabel())
                                }
                            })
                        }}>
                            <CheckIcon className={classes.checkicon} />
                        </IconButton>
                        <IconButton onClick={() => {
                            var newState = { ...workspace.labelState }
                            if (newState['L' + id] != "neg") {
                                if (newState['L' + id] == "pos") {
                                    numLabelHandler({ "pos": numLabel['pos'] - 1, "neg": numLabel['neg'] + 1 })
                                } else {
                                    numLabelHandler({ ...numLabel, "neg": numLabel['neg'] + 1 })
                                }
                            }
                            newState['L' + id] = "neg"
                            dispatch(setLabelState(newState))

                            dispatch(setElementLabel({ element_id: element_id, label: "false" })).then(() => {
                                if (workspace.num_cur_batch == 10) {
                                    dispatch(getElementToLabel())
                                }
                            })
                        }}>
                            <CloseIcon className={classes.crossicon} />
                        </IconButton>
                        <IconButton onClick={() => {
                            var newState = workspace.labelState
                            newState['L' + id] = "ques"
                            dispatch(setLabelState(newState))
                        }}>
                            <QuestionMarkIcon className={classes.questionicon} />
                        </IconButton>
                    </Stack>
                }

            </Line>
        </Box>

    );
}