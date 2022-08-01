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

import {
  Box,
  Stack,
  Typography,
  Divider,
  CircularProgress,
} from "@mui/material";
import React from "react";
import classes from "./index.module.css";
import { useSelector, useDispatch } from "react-redux";
import Element from "./Element";
import useSearchElement from "./customHooks/useSearchElement";
import useLabelState from "./customHooks/useLabelState";
import { getContradictingLabels } from "../DataSlice";
import contradictive_elem_icon from "../Asset/contradicting.svg";

const ContradictingLabelsPanel = ({
  updateMainLabelState,
  updateLabelState,
}) => {
  const contradictingPairsResult = useSelector(
    (state) => state.workspace.contradictiveElemPairsResult
  );

  const contradictingPairsLabelState = useSelector(
    (state) => state.workspace.contradictiveElemPairsLabelState
  );
  const curCategory = useSelector((state) => state.workspace.curCategory);
  const model_version = useSelector((state) => state.workspace.model_version);
  const loadingContradictingLabels = useSelector(
    (state) => state.workspace.loadingContradictingLabels
  );

  const dispatch = useDispatch();

  React.useEffect(() => {
    if (curCategory !== null && model_version !== null && model_version >= 0) {
      dispatch(getContradictingLabels());
    }
  }, [curCategory]);

  const { handlePosLabelState, handleNegLabelState } = useLabelState(
    contradictingPairsLabelState,
    updateMainLabelState,
    updateLabelState
  );

  const { handleSearchPanelClick, searchInput } = useSearchElement();

  const Separator = () => (
    <Divider variant="middle" flexItem>
      <Stack direction={"row"} sx={{ mt: "40px", mb: "40px" }}>
        <div
          className={classes["dot-separator"]}
          style={{ marginRight: "6px" }}
        />
        <div
          className={classes["dot-separator"]}
          style={{ marginRight: "6px" }}
        />
        <div className={classes["dot-separator"]} />
      </Stack>
    </Divider>
  );

  const ContradictingPair = ({ addSeparator, children }) => {
    const childrenArray = React.Children.toArray(children);
    return (
      <Stack direction={"column"} sx={{ alignItems: "center" }}>
        {childrenArray[0]}
        <Box sx={{ display: "flex", flexDirection: "row" }}>
          <img
            src={contradictive_elem_icon}
            alt={"contradictive element"}
            style={{ paddingRight: "5px" }}
          />{" "}
          {"?"}
        </Box>
        {childrenArray[1]}
        {addSeparator ? <Separator /> : null}
      </Stack>
    );
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
          <strong>Contradicting labels</strong>
        </p>
      </Box>
      {loadingContradictingLabels ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "15px",
          }}
        >
          <CircularProgress />
        </div>
      ) : !contradictingPairsResult || contradictingPairsResult.length === 0 ? (
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
          {`No contradicting pairs of examples were found which are semantically similar but were labeled by you with contradicting labels.`}
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
            contradictingPairsResult.length / 2
          } pairs of examples, which are semantically similar but were labeled by you with contradicting labels`}
        </Typography>
      )}
      {!loadingContradictingLabels ? (
        <Box className={classes["search-results"]} sx={{ mt: 7 }}>
          {contradictingPairsResult &&
            contradictingPairsResult.map((pair, i) => (
              <ContradictingPair
                key={i}
                addSeparator={i !== contradictingPairsResult.length - 1}
              >
                {pair.map((element, j) => (
                  <Element
                    key={2 * i + j}
                    searchedIndex={2 * i + j}
                    prediction={element.model_predictions[curCategory]}
                    text={element.text}
                    searchInput={searchInput}
                    id={element.id}
                    docid={element.docid}
                    labelValue={element.user_labels[curCategory]}
                    handleSearchPanelClick={handleSearchPanelClick}
                    handlePosLabelState={handlePosLabelState}
                    handleNegLabelState={handleNegLabelState}
                    labelState={contradictingPairsLabelState}
                  />
                ))}
              </ContradictingPair>
            ))}
        </Box>
      ) : null}
    </Box>
  );
};

export default ContradictingLabelsPanel;
