import { Box } from "@mui/system";
import Stack from '@mui/material/Stack';
import { IconButton } from "@mui/material";
import { useSelector } from 'react-redux';
import checking from '../Asset/checking.svg';
import check from '../Asset/check.svg';
import crossing from '../Asset/crossing.svg';
import cross from '../Asset/cross.svg';
import classes from './Element.module.css';
import useMainLabelState from './customHooks/useElemLabelState';
import useElemStyles from "./customHooks/useElemStyles";
import { useEffect } from "react";


export default function Element(props) {

    const { index, text } = props
    const workspace = useSelector(state => state.workspace) 
    const isSearchActive = useSelector(state => state.workspace.isSearchActive) 
    const { handlePosLabelState, handleNegLabelState } = useMainLabelState({ ...props })
    const { handleTextElemStyle,  text_colors } = useElemStyles({ ...props })


useEffect(()=>{
    if(!isSearchActive ){
        handleTextElemStyle()
    }
  },[isSearchActive])


    return (
        !workspace.curCategory?
            <Box tabIndex="-1" className={handleTextElemStyle()} id={"L" + index}>
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
                                <img className={classes.hovbtn} src={checking} alt="checking" />
                        }
                    </IconButton>
                    <IconButton onClick={handleNegLabelState}>
                        {workspace.labelState['L' + index] == 'neg' ?
                            <img className={classes.resultbtn} src={cross} alt="crossed" /> :
                            <img className={classes.hovbtn} src={crossing} alt="crossinging" />
                        }
                    </IconButton>
                </Stack>
            </Box>
    )
}