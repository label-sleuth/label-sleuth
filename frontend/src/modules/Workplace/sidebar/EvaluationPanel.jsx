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
  cancelEvaluation,
} from "../DataSlice";

import {
  START_EVALUATION_MSG,
  EVALUATION_IN_PROGRESS_MSG,
  PRECISION_RESULT_MSG,
  WAIT_NEW_MODEL_MSG,
} from "../../../const";

const EvaluationPanel = ({ updateMainLabelState, updateLabelState }) => {
  const dispatch = useDispatch();

  const {
    isLoading,
    isInProgress,
    elements,
    labelState,
    initialLabelState,
    lastScore,
    scoreModelVersion,
  } = useSelector(
    (state) => state.workspace.evaluation
  );

  const curCategory = useSelector((state) => state.workspace.curCategory);

  const nextModelShouldBeTraining = useSelector(
    (state) => state.workspace.nextModelShouldBeTraining
  );

  const submitButtonDisabled = React.useMemo(() => {
    return (
      !isInProgress ||
      Object.values(labelState).some(
        (label) => label !== "pos" && label !== "neg"
      )
    );
  }, [isInProgress, labelState]);

  const { handlePosLabelState, handleNegLabelState } = useLabelState(
    labelState,
    updateMainLabelState,
    updateLabelState,
    false // updateCounter
  );

  const { handleSearchPanelClick, searchInput } = useSearchElement();

  const onStartEvaluation = () => {
    dispatch(startEvaluation());
  };

  const calculateChangedCountAndDispatch = (action) => {
    const changedElementsCount = Object.keys(labelState).filter(
      (k) => labelState[k] !== initialLabelState[k]
    ).length;
    dispatch(action(changedElementsCount)).then(() => {
      dispatch(checkStatus());
    });
  };

  const submitEvaluation = () => {
    calculateChangedCountAndDispatch(getEvaluationResults);
  };

  const onCancelEvaluation = () => {
    calculateChangedCountAndDispatch(cancelEvaluation);
  };

  const typographyStyle = {
    display: "flex",
    justifyContent: "center",
    fontSize: "0.8rem",
    color: "rgba(0,0,0,.54)",
    mr: 1,
    ml: 1,
  };

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
          <Button
            onClick={onStartEvaluation}
            disabled={isInProgress || nextModelShouldBeTraining}
          >
            Start {lastScore ? "new" : ""} precision evaluation
          </Button>
          <Divider variant="middle" />
          <Button onClick={submitEvaluation} disabled={submitButtonDisabled}>
            Submit
          </Button>
          <Divider variant="middle" />
          <Button
            onClick={onCancelEvaluation}
            disabled={!!!isInProgress}
          >
            Cancel evaluation
          </Button>
        </Stack>
      </Box>
      <Box className={classes["search-results"]} sx={{ mt: 16 }}>
        <Divider sx={{ mb: 3 }} variant="middle" />
        {isLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "15px",
            }}
          >
            <CircularProgress />
          </div>
        ) : isInProgress ? (
          <Box>
            <Typography sx={typographyStyle}>
              {EVALUATION_IN_PROGRESS_MSG}
            </Typography>
            {elements.map((e, i) => {
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
                  labelState={labelState}
                  handlePosLabelState={handlePosLabelState}
                  handleNegLabelState={handleNegLabelState}
                />
              );
            })}
          </Box>
        ) : lastScore !== null ? (
          <Typography sx={{ ...typographyStyle, fontSize: "1rem" }}>
            {PRECISION_RESULT_MSG(Math.round(evaluationScore * 100))}
          </Typography>
        ) : nextModelShouldBeTraining ? (
          <Typography sx={typographyStyle}>{WAIT_NEW_MODEL_MSG}</Typography>
        ) : (
          <Typography sx={typographyStyle}>{START_EVALUATION_MSG}</Typography>
        )}
      </Box>
    </Box>
  );
};

export default EvaluationPanel;
