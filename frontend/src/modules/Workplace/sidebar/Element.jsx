/*
    Copyright (c) 2022 IBM Corp.
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

import Highlighter from "react-highlight-words";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import check from "../Asset/check.svg";
import checking from "../Asset/checking.svg";
import crossing from "../Asset/crossing.svg";
import cross from "../Asset/cross.svg";
import classes from "./index.module.css";
import { Box } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { panelIds } from "../../../const";
import {
  setFocusedElement,
  fetchCertainDocument,
} from "../redux/DataSlice";
import useLabelState from "../customHooks/useLabelState";

const text_colors = {
  pos: { color: "#3092ab" },
  neg: { color: "#bd3951" },
};

/**
 * Handle the style of the text of the sidebar element based on the models prediction
 * @param {*} modelPrediction 
 * @returns 
 */
// this function is not returned by a custom hook as it is the case of the main panel equivalent
const handleTextElemStyle = (modelPrediction) =>
  modelPrediction === "true" ? classes["text_predict"] : classes["text_normal"];


const Element = ({ element, updateCounterOnLabeling = true }) => {
  const dispatch = useDispatch();
  const { id, docId, text, userLabel, modelPrediction } = element;
  const curCategory = useSelector((state) => state.workspace.curCategory);
  const activePanelId = useSelector(
    (state) => state.workspace.panels.activePanelId
  );
  const curDocName = useSelector((state) => state.workspace.curDocName);
  const searchInput = useSelector(
    (state) => state.workspace.panels[panelIds.SEARCH].input
  );

  const { handlePosLabelState, handleNegLabelState } = useLabelState(
    updateCounterOnLabeling
  );


  const handleElementClick = async () => {
    if (docId === curDocName) {
      dispatch(setFocusedElement(id));
    } else if (docId !== curDocName) {
      dispatch(fetchCertainDocument({ docId })).then(() => {
        dispatch(setFocusedElement(id));
      });
    }
  };

  return (
    <Paper
      onClick={() => handleElementClick()}
      className={handleTextElemStyle(modelPrediction)}
      sx={{ padding: "0 !important", mb: 2, ml: 1, mr: 0 }}
      style={{ cursor: "pointer" }}
    >
      <label
        style={{ cursor: "pointer" }}
        className={
          modelPrediction === "pos"
            ? classes["pred_rec_doc_id"]
            : classes["rec_doc_id"]
        }
      >
        {docId}
      </label>
      <Box>
        <p
          id={id}
          className={classes["elem_text"]}
          style={text_colors[userLabel]}
        >
          <Highlighter
            searchWords={activePanelId === panelIds.SEARCH ? [searchInput] : []}
            autoEscape={false}
            textToHighlight={text}
          />
        </p>
      </Box>
      <Stack
        id={id}
        className={classes["recommend_buttons"]}
        direction="row"
        spacing={0}
        sx={{
          justifyContent: "flex-end",
          marginBottom: 0,
          height: "25px",
          mr: 1,
          mb: 1,
        }}
      >
        {curCategory !== null && (
          <>
            <div
              className={classes.resultbtn}
              onClick={(e) => {
                e.stopPropagation();
                handlePosLabelState(element);
              }}
            >
              {userLabel === "pos" ? (
                <img src={check} alt="checked" />
              ) : (
                <img className={classes.hovbtn} src={checking} alt="checking" />
              )}
            </div>
            <div
              className={classes.resultbtn}
              positiveicon="false"
              onClick={(e) => {
                e.stopPropagation();
                handleNegLabelState(element);
              }}
            >
              {userLabel === "neg" ? (
                <img src={cross} alt="crossed" />
              ) : (
                <img
                  className={classes.hovbtn}
                  src={crossing}
                  alt="crossinging"
                />
              )}
            </div>
          </>
        )}
      </Stack>
    </Paper>
  );
};

export default Element;
