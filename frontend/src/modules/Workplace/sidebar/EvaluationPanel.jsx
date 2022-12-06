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
import { Box, Button, Stack, Divider } from "@mui/material";
import classes from "./index.module.css";
import { useSelector, useDispatch } from "react-redux";
import Element from "./Element";
import { checkStatus, startEvaluation, getEvaluationResults, cancelEvaluation } from "../redux";
import { ButtonGroup } from "@mui/material";
import {
  START_EVALUATION_MSG,
  EVALUATION_IN_PROGRESS_MSG,
  PRECISION_RESULT_MSG,
  WAIT_NEW_MODEL_MSG,
  panelIds,
} from "../../../const";
import { Header, PanelTypography, Loading } from "./components/commonComponents";

const EvaluationPanel = () => {
  const dispatch = useDispatch();

  const loading = useSelector((state) => state.workspace.panels.loading[panelIds.EVALUATION]);

  const { elements, initialElements, isInProgress, lastScore, scoreModelVersion } = useSelector(
    (state) => state.workspace.panels[panelIds.EVALUATION]
  );

  const currentContentData = React.useMemo(() => elements && Object.values(elements), [elements]);

  const isLoading = useSelector((state) => state.workspace.panels.loading[panelIds.EVALUATION]);

  const modelVersion = useSelector((state) => state.workspace.modelVersion);

  const nextModelShouldBeTraining = useSelector((state) => state.workspace.nextModelShouldBeTraining);

  const evaluationElementsCount = React.useMemo(
    () =>
      currentContentData
        ? currentContentData.map((element) => element.userLabel !== "none").reduce((partialSum, a) => partialSum + a, 0)
        : 0,
    [currentContentData]
  );

  const submitButtonDisabled = React.useMemo(() => {
    return !isInProgress || evaluationElementsCount !== currentContentData.length;
  }, [isInProgress, evaluationElementsCount, currentContentData]);

  const onStartEvaluation = () => {
    dispatch(startEvaluation());
  };

  const calculateChangedCountAndDispatch = (action) => {
    const changedElementsCount = Object.keys(elements).filter(
      (k) => elements[k].userLabel !== initialElements[k].userLabel
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

  const progressLabel = React.useMemo(() => {
    return currentContentData && `(${evaluationElementsCount}/${currentContentData.length})`;
  }, [evaluationElementsCount, currentContentData]);

  return (
    <Box>
      <Header message={"Precision evaluation"} />
      <Box sx={{ display: "flex", justifyContent: "center", mt: 1, mb: 2 }}>
        <Stack>
          {isInProgress && (
            <PanelTypography sx={{ fontSize: "1rem", pt: 2 }}>{`Progress: ${progressLabel}`}</PanelTypography>
          )}
          <ButtonGroup sx={{ pt: 2 }} variant="text" aria-label="text button group">
            <Button
              sx={{ textTransform: "none" }}
              onClick={onStartEvaluation}
              disabled={loading || isInProgress || nextModelShouldBeTraining}
            >
              Start
            </Button>
            <Button sx={{ textTransform: "none" }} onClick={submitEvaluation} disabled={submitButtonDisabled}>
              Submit
            </Button>
            <Button sx={{ textTransform: "none" }} onClick={onCancelEvaluation} disabled={!!!isInProgress}>
              Cancel
            </Button>
          </ButtonGroup>
        </Stack>
      </Box>
      <Divider variant="middle" />
      <Box sx={{ mt: 2 }}>
        {isLoading ? null : isInProgress ? (
          <PanelTypography>{EVALUATION_IN_PROGRESS_MSG} </PanelTypography>
        ) : lastScore !== null ? (
          <PanelTypography sx={{ fontSize: "1rem" }}>
            {PRECISION_RESULT_MSG(Math.round(lastScore * 100), modelVersion, scoreModelVersion)}
          </PanelTypography>
        ) : nextModelShouldBeTraining ? (
          <PanelTypography>{WAIT_NEW_MODEL_MSG}</PanelTypography>
        ) : (
          <PanelTypography>{START_EVALUATION_MSG}</PanelTypography>
        )}
      </Box>
      <Box sx={{ mt: isInProgress ? 16 : 12 }} className={classes["element-list"]}>
        {isLoading ? (
          <Loading />
        ) : isInProgress ? (
          <Box>
            {currentContentData.map((element, i) => (
              <Element element={element} updateCounterOnLabeling={false} key={element.id} index={i} />
            ))}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};

export default EvaluationPanel;
