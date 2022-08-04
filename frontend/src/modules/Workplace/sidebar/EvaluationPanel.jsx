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

import React from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Stack,
  Divider,
} from "@mui/material";
import classes from "./index.module.css";
import { useSelector, useDispatch } from "react-redux";
import Element from "./Element";
import useSearchElement from "./customHooks/useSearchElement";
import useLabelState from "./customHooks/useLabelState";
import {
  checkStatus,
  startEvaluation,
  getEvaluationResults,
  cancelEvaluation
} from "../DataSlice";

const EvaluationPanel = ({ updateMainLabelState, updateLabelState }) => {
  const dispatch = useDispatch();

  const evaluationInProgress = useSelector(
    (state) => state.workspace.evaluationInProgress
  );
  const evaluationElements = useSelector(
    (state) => state.workspace.evaluationElements
  );

  const evaluationLabelState = useSelector(
    (state) => state.workspace.evaluationLabelState
  );

  const initialEvaluationLabelState = useSelector(
    (state) => state.workspace.initialEvaluationLabelState
  );

  const loadingEvaluation = useSelector(
    (state) => state.workspace.loadingEvaluation
  );

  const evaluationScore = useSelector(
    (state) => state.workspace.evaluationScore
  );

  const curCategory = useSelector(
    (state) => state.workspace.curCategory
  );

  const nextModelShouldBeTraining = useSelector(
    (state) => state.workspace.nextModelShouldBeTraining
  );

  const submitButtonDisabled = React.useMemo(() => {
    return (
      !evaluationInProgress ||
      Object.values(evaluationLabelState).some(
        (label) => label !== "pos" && label !== "neg"
      )
    );
  }, [evaluationInProgress, evaluationLabelState]);

  const { handlePosLabelState, handleNegLabelState } = useLabelState(
    evaluationLabelState,
    updateMainLabelState,
    updateLabelState,
    false // updateCounter
  );

  const { handleSearchPanelClick, searchInput } = useSearchElement();

  const onStartEvaluation = () => {
    dispatch(startEvaluation())
  };

  const calculateChangedCountAndDispatch = (action) => {
    const changedElementsCount = Object.keys(evaluationLabelState).filter(k => evaluationLabelState[k] !== initialEvaluationLabelState[k]).length
    dispatch(action(changedElementsCount)).then(() => {
      dispatch(checkStatus())
    });
  }
  
  
  const submitEvaluation = () => {
    calculateChangedCountAndDispatch(getEvaluationResults)
    
  };

  const onCancelEvaluation = () => {
    calculateChangedCountAndDispatch(cancelEvaluation)
  };

  const typographyStyle = {
    display: "flex",
    justifyContent: "center",
    fontSize: "0.8rem",
    color: "rgba(0,0,0,.54)",
    mr: 1,
    ml: 1,
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItem: "center",
          marginTop: "11px",
          borderBottom: "1px solid #e2e2e2",
          pb: "12px",
          justifyContent: "center",
        }}
      >
        <p style={{ width: "100%", textAlign: "center" }}>
          <strong>Precision evaluation</strong>
        </p>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center", mt: 3, mb: 2 }}>
        <Stack>
          <Button onClick={onStartEvaluation} disabled={evaluationInProgress || nextModelShouldBeTraining}>
            Start {evaluationScore ? "new" : ""} precision evaluation
          </Button>
          <Divider variant="middle" />
          <Button onClick={submitEvaluation} disabled={submitButtonDisabled}>
            Submit
          </Button>
          <Divider variant="middle" />
          <Button onClick={onCancelEvaluation} disabled={!!!evaluationInProgress}>
            Cancel evaluation
          </Button>
        </Stack>
      </Box>
      <Box className={classes["search-results"]} sx={{ mt: 16 }}>
        <Divider sx={{ mb: 3 }} variant="middle" />
        {loadingEvaluation ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "15px",
            }}
          >
            <CircularProgress />
          </div>
        ) : evaluationInProgress ? (
          <Box>
            <Typography
              sx={typographyStyle}
            >
              {
                "Label all the elements. Once its done, click on Submit to get the precision score."
              }
            </Typography>
            {evaluationElements.map((e, i) => {
              return (
                <Element
                  key={i}
                  searchedIndex={i}
                  prediction={e.model_predictions[curCategory]}
                  text={e.text}
                  id={e.id}
                  docid={e.docid}
                  labelValue={e.user_labels[curCategory]}
                  handleSearchPanelClick={handleSearchPanelClick}
                  labelState={evaluationLabelState}
                  handlePosLabelState={handlePosLabelState}
                  handleNegLabelState={handleNegLabelState}
                />
              );
            })}
          </Box>
        ) : evaluationScore !== null ? (
          <Typography
            sx={{...typographyStyle, fontSize: "1rem"}}
          >
            The precision is:{" "}
            {Math.round(evaluationScore * 100)}%
          </Typography>
        ) :
        nextModelShouldBeTraining ? (
          <Typography
              sx={typographyStyle}
            >
              {
                "Please wait till the next model is available to start the evaluation"
              }
            </Typography>
        ) 
        : (
          <Typography
            sx={typographyStyle}
          >
            {
              "Click on Start precision evaluation to start the evaluation process"
            }
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default EvaluationPanel;
