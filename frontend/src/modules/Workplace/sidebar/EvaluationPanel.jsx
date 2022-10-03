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
import {
  checkStatus,
  startEvaluation,
  getEvaluationResults,
  cancelEvaluation,
} from "../redux/DataSlice";

import {
  START_EVALUATION_MSG,
  EVALUATION_IN_PROGRESS_MSG,
  PRECISION_RESULT_MSG,
  WAIT_NEW_MODEL_MSG,
  panelIds,
} from "../../../const";
import {
  Header,
  PanelTypography,
  Loading,
} from "./components/commonComponents";
import usePanelPagination from "../../../customHooks/usePanelPagination";
import { CustomPagination } from "../../../components/pagination/CustomPagination";

const EvaluationPanel = () => {
  const dispatch = useDispatch();

  const sidebarPanelElementsPerPage = useSelector(
    (state) => state.featureFlags.sidebarPanelElementsPerPage
  );
  const loading = useSelector(
    (state) => state.workspace.panels.loading[panelIds.EVALUATION]
  );

  const {
    currentContentData,
    currentPage,
    onPageChange,
    isPaginationRequired,
  } = usePanelPagination({
    elementsPerPage: sidebarPanelElementsPerPage,
    panelId: panelIds.EVALUATION,
    fakePagination: true,
  });

  const {
    elements,
    initialElements,
    isInProgress,
    lastScore,
    scoreModelVersion,
  } = useSelector((state) => state.workspace.panels[panelIds.EVALUATION]);

  const isLoading = useSelector(
    (state) => state.workspace.panels.loading[panelIds.EVALUATION]
  );

  const modelVersion = useSelector((state) => state.workspace.modelVersion);

  const nextModelShouldBeTraining = useSelector(
    (state) => state.workspace.nextModelShouldBeTraining
  );

  const submitButtonDisabled = React.useMemo(() => {
    return (
      !isInProgress ||
      Object.values(elements).some(
        (element) => element.userLabel !== "pos" && element.userLabel !== "neg"
      )
    );
  }, [isInProgress, elements]);

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

  return (
    <Box>
      <Header message={"Precision evaluation"} />
      <Box sx={{ display: "flex", justifyContent: "center", mt: 3, mb: 2 }}>
        <Stack>
          <Button
            onClick={onStartEvaluation}
            disabled={loading || isInProgress || nextModelShouldBeTraining}
          >
            Start {lastScore ? "new" : ""} precision evaluation
          </Button>
          <Divider variant="middle" />
          <Button onClick={submitEvaluation} disabled={submitButtonDisabled}>
            Submit
          </Button>
          <Divider variant="middle" />
          <Button onClick={onCancelEvaluation} disabled={!!!isInProgress}>
            Cancel evaluation
          </Button>
        </Stack>
      </Box>
      <Divider variant="middle" />
      <Box sx={{ mt: 2 }}>
        {isLoading ? null : isInProgress ? (
          <PanelTypography>{EVALUATION_IN_PROGRESS_MSG} </PanelTypography>
        ) : lastScore !== null ? (
          <PanelTypography sx={{ fontSize: "1rem" }}>
            {PRECISION_RESULT_MSG(
              Math.round(lastScore * 100),
              modelVersion,
              scoreModelVersion
            )}
          </PanelTypography>
        ) : nextModelShouldBeTraining ? (
          <PanelTypography>{WAIT_NEW_MODEL_MSG}</PanelTypography>
        ) : (
          <PanelTypography>{START_EVALUATION_MSG}</PanelTypography>
        )}
      </Box>
      <Box
        sx={{ mt: 20 }}
        className={`${classes["element-list"]} ${
          isPaginationRequired ? classes.pagination_margin : ""
        }`}
      >
        {isLoading ? (
          <Loading />
        ) : isInProgress ? (
          <Box>
            {currentContentData.map((element, i) => {
              return (
                <Element
                  element={element}
                  updateCounterOnLabeling={false}
                  key={element.id}
                />
              );
            })}
          </Box>
        ) : null}
      </Box>
      <CustomPagination
        currentContentData={currentContentData}
        hitCount={elements ? Object.keys(elements).length : 0}
        sidebarPanelElementsPerPage={sidebarPanelElementsPerPage}
        currentPage={currentPage}
        onPageChange={onPageChange}
        isPaginationRequired={isPaginationRequired}
      />
    </Box>
  );
};

export default EvaluationPanel;
