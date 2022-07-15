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

import { Box, Typography } from "@mui/material";
import React from "react";
import classes from "./index.module.css";
import { useSelector } from "react-redux";
import Element from "./Element";
import useSearchElement from "./customHooks/useSearchElement";
import useLabelState from "./customHooks/useLabelState";

const DisagreementsPanel = ({ updateMainLabelState, updateLabelState }) => {
  const workspace = useSelector((state) => state.workspace);
  const disagreeElemResult = useSelector(
    (state) => state.workspace.disagreeElemResult
  );
  let newDisagreeElemLabelState = { ...workspace.disagreeElemLabelState };
  const currDisagreeElemLabelState = workspace.disagreeElemLabelState;
  const { handlePosLabelState, handleNegLabelState } = useLabelState(
    newDisagreeElemLabelState,
    updateMainLabelState,
    updateLabelState
  );
  const { handleSearchPanelClick, searchInput } = useSearchElement();

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
          <strong>Disagreements labels</strong>
        </p>
      </Box>
      {!disagreeElemResult || disagreeElemResult.length == 0 ? (
        <Typography
          sx={{
            display: "flex",
            justifyContent: "center",
            fontSize: "0.8rem",
            color: "rgba(0,0,0,.54)",
            mt: 2,
            mb: 2,
            mr: 1,
            ml: 1,
          }}
        >
          {`No model predictions disagree with your labels.`}
        </Typography>
      ) : (
        <Typography
          sx={{
            display: "flex",
            justifyContent: "center",
            fontSize: "0.8rem",
            color: "rgba(0,0,0,.54)",
            mt: 2,
            mb: 2,
            mr: 1,
            ml: 1,
          }}
        >
          {`Review these examples in which the labels provided by you do not match the prediction made by the system`}
        </Typography>
      )}
      <Box className={classes["search-results"]} sx={{ mt: 4 }}>
        {disagreeElemResult &&
          disagreeElemResult.map((res, i) => {
            return (
              <Element
                key={i}
                searchedIndex={i}
                prediction={res.model_predictions[workspace.curCategory]}
                text={res.text}
                searchInput={searchInput}
                id={res.id}
                docid={res.docid}
                labelValue={res.user_labels[workspace.curCategory]}
                handleSearchPanelClick={handleSearchPanelClick}
                handlePosLabelState={handlePosLabelState}
                handleNegLabelState={handleNegLabelState}
                labelState={currDisagreeElemLabelState}
              />
            );
          })}
      </Box>
    </Box>
  );
};

export default DisagreementsPanel;
