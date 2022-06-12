import Highlighter from "react-highlight-words";
import Paper from '@mui/material/Paper';
import IconButton from "@mui/material/IconButton";
import Stack from '@mui/material/Stack';
import check from '../Asset/check.svg';
import checking from '../Asset/checking.svg';
import crossing from '../Asset/crossing.svg';
import cross from '../Asset/cross.svg';
import classes from './index.module.css';
import PanelStyles from './PanelStyles';
import check_predict from '../Asset/check_predict.svg';
import { Box } from '@mui/material';
import { useSelector } from "react-redux";

export default function Element(props) {

    const {
        text,
        searchInput,
        docid,
        id,
        prediction,
        handleSearchPanelClick,
        handlePosLabelState,
        handleNegLabelState,
        searchedIndex,
        labelState
    } = props

    const { text_colors, handleTextElemStyle } = PanelStyles(prediction)
    const searchedElemIndex = `L${searchedIndex}-${id}`
    const workspace = useSelector(state => state.workspace)

    return (
        <Paper
            className={handleTextElemStyle()}
            sx={{ padding: '0 !important', mb: 2, ml: 1, mr: 0 }}
        >
            <label className={classes["rec_doc_id"]}>{docid}</label>
            <Box >
                <p docid={docid} id={id} className={classes["elem_text"]} style={(text_colors[labelState[searchedElemIndex]])}>
                    <Highlighter
                        searchWords={[searchInput]}
                        autoEscape={true}
                        textToHighlight={text}
                        style={{ cursor: "pointer" }}
                        onClick={handleSearchPanelClick}
                    />
                </p>
            </Box>
            <Stack id={id} searchedindex={searchedIndex} className={classes["recommend_buttons"]}
                direction="row" spacing={0} sx={{ justifyContent: "flex-end", marginBottom: 0, height: "25px", mr: 1, mb: 1 }}>
                {workspace.curCategory &&
                    <Box>
                        <IconButton className={classes.resultbtn}
                            onClick={handlePosLabelState}>
                            {labelState[searchedElemIndex] == 'pos' ?
                                <img src={check} alt="checked" /> :
                                prediction == 'true' && labelState[searchedElemIndex] !== 'neg' ?
                                    <img src={check_predict} alt="predicted checking" /> :
                                    <img className={classes.hovbtn} src={checking} alt="checking" />
                            }
                        </IconButton>
                        <IconButton className={classes.resultbtn} positiveicon="false" onClick={handleNegLabelState}>
                            {labelState[searchedElemIndex] == 'neg' ?
                                <img src={cross} alt="crossed" /> :
                                <img className={classes.hovbtn} src={crossing} alt="crossinging" />
                            }
                        </IconButton>
                    </Box>
                    }
            </Stack>
        </Paper>
    )
}
