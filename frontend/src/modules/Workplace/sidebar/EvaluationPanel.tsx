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

import React, { useCallback, useMemo } from "react";
import { Box, Button, Stack, Divider } from "@mui/material";
import classes from "./index.module.css";
import { useAppDispatch, useAppSelector } from "../../../customHooks/useRedux";
import { SidebarElement } from "../../../components/element/SidebarElement";
import { checkStatus, getEvaluationResults, cancelEvaluation } from "../redux";
import { ButtonGroup } from "@mui/material";
import {
  START_EVALUATION_MSG,
  EVALUATION_IN_PROGRESS_MSG,
  EVALUATION_RESULT_MSG,
  WAIT_NEW_MODEL_MSG,
  PanelIdsEnum,
  LabelTypesEnum,
} from "../../../const";
import {
  Header,
  PanelTypography,
  Loading,
} from "./components/commonComponents";
import { useFetchPanelElements } from "../../../customHooks/useFetchPanelElements";
import { Element } from "../../../global";
import { returnByMode } from "../../../utils/utils";
import { useNotification } from "../../../utils/notification";
import { toast } from "react-toastify";

const EvaluationPanel = () => {
  const dispatch = useAppDispatch();
  const { notify } = useNotification();
  const loading = useAppSelector(
    (state) => state.workspace.panels.loading[PanelIdsEnum.EVALUATION]
  );
  const {
    elements,
    initialElements,
    isInProgress,
    lastScore,
    scoreModelVersion,
  } = useAppSelector(
    (state) => state.workspace.panels.panels[PanelIdsEnum.EVALUATION]
  );

  const isLoading = useAppSelector(
    (state) => state.workspace.panels.loading[PanelIdsEnum.EVALUATION]
  );
  const modelVersion = useAppSelector((state) => state.workspace.modelVersion);
  const mode = useAppSelector((state) => state.workspace.mode);
  const nextModelShouldBeTraining = useAppSelector(
    (state) => state.workspace.nextModelShouldBeTraining
  );

  const currentContentData = React.useMemo<Element[] | null>(
    () => (elements !== null ? Object.values(elements) : null),
    [elements]
  );

  const fetchEvaluationElements = useFetchPanelElements({
    panelId: PanelIdsEnum.EVALUATION,
  });

  const metric = useMemo(
    () => returnByMode("precision", "accuracy", mode),
    [mode]
  );

  const evaluationElementsCount = React.useMemo(
    () =>
      currentContentData
        ? currentContentData
            .map((element) =>
              returnByMode(
                element.userLabel !== LabelTypesEnum.NONE,
                element.multiclassUserLabel !== null,
                mode
              )
            )
            .reduce(
              (partialSum: number, isLabeled: boolean) =>
                partialSum + (isLabeled ? 1 : 0),
              0
            )
        : 0,
    [currentContentData, mode]
  );

  const noPositivePredictions = React.useMemo(
    () => currentContentData !== null && currentContentData.length === 0,
    [currentContentData]
  );

  const submitButtonDisabled = React.useMemo(() => {
    return (
      !isInProgress ||
      (currentContentData !== null &&
        evaluationElementsCount !== currentContentData.length) ||
      noPositivePredictions
    );
  }, [
    isInProgress,
    evaluationElementsCount,
    currentContentData,
    noPositivePredictions,
  ]);

  const onStartEvaluation = () => {
    fetchEvaluationElements();
  };

  const getChangedElementsCount = useCallback(
    () =>
      elements !== null
        ? Object.keys(elements).filter((k) =>
            returnByMode(
              elements[k].userLabel !== initialElements[k].userLabel,
              elements[k].multiclassUserLabel !==
                initialElements[k].multiclassUserLabel,
              mode
            )
          ).length
        : 0,
    [elements, initialElements, mode]
  );

  const submitEvaluation = useCallback(() => {
    const changedElementsCount = getChangedElementsCount();
    dispatch(getEvaluationResults(changedElementsCount)).then((a) => {
      notify(
        EVALUATION_RESULT_MSG(
          Math.round((a.payload as { score: number }).score * 100),
          scoreModelVersion,
          metric
        ),
        { type: toast.TYPE.SUCCESS, toastId: "evaluation_result_toast" }
      );
      dispatch(checkStatus());
    });
  }, [dispatch, getChangedElementsCount, metric, notify, scoreModelVersion]);

  const onCancelEvaluation = useCallback(() => {
    const changedElementsCount = getChangedElementsCount();
    dispatch(
      cancelEvaluation({
        changedElementsCount,
        cancelByAPI: !!!noPositivePredictions,
      })
    ).then(() => dispatch(checkStatus()));
  }, [dispatch, getChangedElementsCount, noPositivePredictions]);

  const progressLabel = React.useMemo(() => {
    return (
      currentContentData &&
      `(${evaluationElementsCount}/${currentContentData.length})`
    );
  }, [evaluationElementsCount, currentContentData]);

  const messages = React.useMemo(() => {
    const l: string[] = [];

    if (isLoading) {
      return l;
    } else if (!isInProgress) {
      let report = "";
      if (lastScore !== null) {
        report += EVALUATION_RESULT_MSG(
          Math.round(lastScore * 100),
          scoreModelVersion,
          metric
        );
      }
      report += START_EVALUATION_MSG(modelVersion, scoreModelVersion);
      report += "\n\n";
      l.push(report);
    } else if (isInProgress) {
      l.push(EVALUATION_IN_PROGRESS_MSG);
    }

    if (nextModelShouldBeTraining) {
      l.push(WAIT_NEW_MODEL_MSG);
    }

    return l;
  }, [
    nextModelShouldBeTraining,
    isInProgress,
    lastScore,
    scoreModelVersion,
    modelVersion,
    isLoading,
    metric,
  ]);

  return (
    <Box>
      <Header
        message={`${metric[0].toUpperCase() + metric.slice(1)} evaluation`}
      />
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mt: 1,
          mb: 2,
        }}
      >
        <Stack>
          {isInProgress && !noPositivePredictions && (
            <PanelTypography
              sx={{ fontSize: "1rem", pt: 2 }}
            >{`Progress: ${progressLabel}`}</PanelTypography>
          )}
          <ButtonGroup
            sx={{ pt: 2 }}
            variant="text"
            aria-label="text button group"
          >
            <Button
              sx={{ textTransform: "none" }}
              onClick={onStartEvaluation}
              disabled={loading || isInProgress || nextModelShouldBeTraining}
            >
              Start
            </Button>
            <Button
              sx={{ textTransform: "none" }}
              onClick={submitEvaluation}
              disabled={submitButtonDisabled}
            >
              Submit
            </Button>
            <Button
              sx={{ textTransform: "none" }}
              onClick={onCancelEvaluation}
              disabled={!!!isInProgress}
            >
              Cancel
            </Button>
          </ButtonGroup>
        </Stack>
      </Box>
      <Divider variant="middle" sx={{ mb: 2 }} />
      {currentContentData?.length === 0 ? (
        <Box>
          <PanelTypography sx={{ fontSize: "1rem" }}>
            {`Currently it's not possible to evaluate the ${metric} of the model because there are no positive predictions.`}
          </PanelTypography>
        </Box>
      ) : (
        <Box sx={{ height: "90vh" }}>
          <Box sx={{ mb: 2 }}>
            {messages.map((m, i) => (
              <PanelTypography key={i}>{m}</PanelTypography>
            ))}
          </Box>
          <Box className={classes["element-list"]}>
            {isLoading ? (
              <Loading />
            ) : isInProgress && currentContentData !== null ? (
              <Box>
                {currentContentData.map((element, i) => (
                  <SidebarElement
                    element={element}
                    updateCounterOnLabeling={false}
                    key={element.id}
                    index={i}
                  />
                ))}
              </Box>
            ) : null}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default EvaluationPanel;
