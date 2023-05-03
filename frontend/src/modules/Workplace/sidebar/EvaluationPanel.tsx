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

import React, { useCallback } from "react";
import { Box, Button, Stack, Divider } from "@mui/material";
import classes from "./index.module.css";
import { useAppDispatch, useAppSelector } from "../../../customHooks/useRedux";
import { SidebarElement } from "../../../components/element/SidebarElement";
import { checkStatus, getEvaluationResults, cancelEvaluation } from "../redux";
import { ButtonGroup } from "@mui/material";
import {
  START_EVALUATION_MSG,
  EVALUATION_IN_PROGRESS_MSG,
  PRECISION_RESULT_MSG,
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

const EvaluationPanel = () => {
  const dispatch = useAppDispatch();

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
  //const elements: ElementsDict | null = {};
  //const initialElements: ElementsDict | null = {};

  const isLoading = useAppSelector(
    (state) => state.workspace.panels.loading[PanelIdsEnum.EVALUATION]
  );
  const modelVersion = useAppSelector((state) => state.workspace.modelVersion);
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

  const evaluationElementsCount = React.useMemo(
    () =>
      currentContentData
        ? currentContentData
            .map((element) => element.userLabel !== LabelTypesEnum.NONE)
            .reduce(
              (partialSum: number, isLabeled: boolean) =>
                partialSum + (isLabeled ? 1 : 0),
              0
            )
        : 0,
    [currentContentData]
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
        ? Object.keys(elements).filter(
            (k) => elements[k].userLabel !== initialElements[k].userLabel
          ).length
        : 0,
    [elements, initialElements]
  );

  const submitEvaluation = useCallback(() => {
    const changedElementsCount = getChangedElementsCount();
    dispatch(getEvaluationResults(changedElementsCount)).then(() =>
      dispatch(checkStatus())
    );
  }, [dispatch, getChangedElementsCount]);

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

  return (
    <Box>
      <Header message={"Precision evaluation"} />
      <Box sx={{ display: "flex", justifyContent: "center", mt: 1, mb: 2 }}>
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
      <Divider variant="middle" />
      {currentContentData?.length === 0 ? (
        <Box sx={{ mt: 1 }}>
          <PanelTypography sx={{ fontSize: "1rem" }}>
            {
              "Currently it's not possible to evaluate the precision of the model because there are no positive predictions."
            }
          </PanelTypography>
        </Box>
      ) : (
        <>
          <Box sx={{ mt: 2 }}>
            {isLoading ? null : isInProgress ? (
              <PanelTypography>{EVALUATION_IN_PROGRESS_MSG} </PanelTypography>
            ) : lastScore !== null &&
              scoreModelVersion !== null &&
              modelVersion !== null ? (
              <PanelTypography sx={{ fontSize: "0.9rem" }}>
                {PRECISION_RESULT_MSG(
                  Math.round(lastScore * 100),
                  modelVersion,
                  scoreModelVersion
                )}
              </PanelTypography>
            ) : nextModelShouldBeTraining ? (
              <PanelTypography>{WAIT_NEW_MODEL_MSG}</PanelTypography>
            ) : (
              <PanelTypography sx={{fontSize:"0.9rem"}}>{START_EVALUATION_MSG}</PanelTypography>
            )}
          </Box>
          <Box
            sx={{ mt: isInProgress ? 16 : 12 }}
            className={classes["element-list"]}
          >
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
        </>
      )}
    </Box>
  );
};

export default EvaluationPanel;
