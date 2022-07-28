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
import { useSelector, useDispatch } from "react-redux";
import Element from "./Element";
import useSearchElement from "./customHooks/useSearchElement";
import useLabelState from "./customHooks/useLabelState";
import { getContradictingLabels } from "../DataSlice";

const ContradictingLabelsPanel = ({
  updateMainLabelState,
  updateLabelState,
}) => {

  const ContradictingPairsResult = useSelector(
    (state) => state.workspace.contradictiveElemPairsResult
  );
  const contradictingPairsLabelState = useSelector(
    (state) => state.workspace.contradictiveElemPairsLabelState
  );
  const curCategory = useSelector((state) => state.workspace.curCategory);
  const neg_label_num = useSelector((state) => state.workspace.neg_label_num);
  const pos_label_num = useSelector((state) => state.workspace.pos_label_num);

  const dispatch = useDispatch();

  React.useEffect(() => {
    dispatch(getContradictingLabels());
  }, [pos_label_num, neg_label_num]);

  const { handlePosLabelState, handleNegLabelState } = useLabelState(
    contradictingPairsLabelState,
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
          <strong>Contradicting labels</strong>
        </p>
      </Box>
      {!ContradictingPairsResult || ContradictingPairsResult.length == 0 ? (
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
          {`No contradictiving pairs of examples were found which are semantically similar but were labeled by you with contradicting labels.`}
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
          {`Review these ${
            ContradictingPairsResult.length / 2
          } pairs of examples, which are semantically similar but were labeled by you with contradicting labels`}
        </Typography>
      )}
      <Box className={classes["search-results"]} sx={{ mt: 7 }}>
        {ContradictingPairsResult &&
          ContradictingPairsResult.map((res, i) => {
            return (
              <div
                key={i}
                className={
                  ContradictingPairsResult.length > 2 ? classes.separator : ""
                }
              >
                <Element
                  key={i}
                  searchedIndex={i}
                  prediction={res.model_predictions[curCategory]}
                  text={res.text}
                  searchInput={searchInput}
                  id={res.id}
                  docid={res.docid}
                  labelValue={res.user_labels[curCategory]}
                  handleSearchPanelClick={handleSearchPanelClick}
                  handlePosLabelState={handlePosLabelState}
                  handleNegLabelState={handleNegLabelState}
                  labelState={contradictingPairsLabelState}
                />
              </div>
            );
          })}
      </Box>
    </Box>
  );
};

export default ContradictingLabelsPanel;
