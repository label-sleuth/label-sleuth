import { Box } from "@mui/system";
import Stack from '@mui/material/Stack';
import { IconButton } from "@mui/material";
import { useSelector } from 'react-redux';
import checking from '../Asset/checking.svg';
import check from '../Asset/check.svg';
import check_predict from '../Asset/check_predict.svg';
import crossing from '../Asset/crossing.svg';
import cross from '../Asset/cross.svg';
import questioning from '../Asset/questioning.svg';
import question from '../Asset/question.svg';
import classes from './Element.module.css';
import useMainLabelState from './useElemLabelState';
import useElemStyles from "./useElemStyles";


export default function Sentence(props) {

    const { index, text, prediction } = props
    const workspace = useSelector(state => state.workspace)
    const { handlePosLabelState, handleNegLabelState, handleQuestLabelState } = useMainLabelState({ ...props })
    const { handleTextElemStyle,  text_colors } = useElemStyles({ ...props })

    return (
        !workspace.curCategory?
            <Box tabIndex="-1" className={classes["text_normal"]}>
                <p className={classes["nodata_text"]}>{text}</p>
            </Box>
            :
            <Box tabIndex="-1"
                className={handleTextElemStyle()}
                id={"L" + index}  >
                <p className={classes.data_text} style={(text_colors[workspace.labelState['L' + index]])}>{text}</p>
                <Stack className={classes.checking_buttons} direction="row" spacing={0}>
                    <IconButton
                        onClick={handlePosLabelState}>
                        {workspace.labelState['L' + index] == 'pos' ?
                            <img className={classes.resultbtn} src={check} alt="checked" /> :
                            prediction[index] == true && workspace.labelState['L' + index] !== 'neg' && workspace.labelState['L' + index] !== 'ques' ?
                                <img className={classes.resultbtn} src={check_predict} alt="predicted checking" /> :
                                <img className={classes.hovbtn} src={checking} alt="checking" />
                        }
                    </IconButton>
                    <IconButton onClick={handleNegLabelState}>
                        {workspace.labelState['L' + index] == 'neg' ?
                            <img className={classes.resultbtn} src={cross} alt="crossed" /> :
                            <img className={classes.hovbtn} src={crossing} alt="crossinging" />
                        }
                    </IconButton>
                    <IconButton onClick={handleQuestLabelState}>
                        {workspace.labelState['L' + index] == 'ques' ?
                            <img className={classes.resultbtn} src={question} alt="questioned" /> :
                            <img className={classes.hovbtn} src={questioning} alt="questioning" />
                        }
                    </IconButton>
                </Stack>
            </Box>
    )
}