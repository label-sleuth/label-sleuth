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
import { getContradictingLabels } from "../redux/DataSlice";
import contradictive_elem_icon from "../Asset/contradicting.svg";
import { panelIds } from "../../../const";

const ContradictingLabelsPanel = () => {
  const { elements, pairs } = useSelector(
    (state) => state.workspace.panels[panelIds.CONTRADICTING_LABELS]
  );
  const loading = useSelector(
    (state) => state.workspace.panels.loading[panelIds.CONTRADICTING_LABELS]
  );

  const curCategory = useSelector((state) => state.workspace.curCategory);
  const modelVersion = useSelector((state) => state.workspace.modelVersion);

  const dispatch = useDispatch();

  React.useEffect(() => {
    if (curCategory !== null && modelVersion !== null && modelVersion >= 0) {
      dispatch(getContradictingLabels());
    }
  }, [curCategory]);

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
      <Stack direction={"column"} sx={{ alignItems: "center",  }}>
        {childrenArray[0]}
        <Box sx={{ display: "flex", flexDirection: "row" }}>
          <img
            src={contradictive_elem_icon}
            alt={"contradictive element"}
            style={{ paddingRight: "5px" }}
          />
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
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "15px",
          }}
        >
          <CircularProgress />
        </div>
      ) : !pairs || pairs.length === 0 ? (
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
          {`No contradicting pairs of examples were found.`}
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
            pairs.length
          } pairs of examples, which are semantically similar but were labeled by you with contradicting labels`}
        </Typography>
      )}
      {!loading ? (
        <Box className={classes["search-results"]} sx={{ mt: 7 }}>
          {pairs &&
            pairs.map((pair, i) => (
              <ContradictingPair
                key={i}
                addSeparator={i !== pairs.length - 1}
              >
                {pair.map((elementId, j) => {
                  const element = elements[elementId]
                  return (
                    <Element
                      key={2 * i + j}
                      element={element}
                    />
                  )})}
              </ContradictingPair>
            ))}
        </Box>
      ) : null}
    </Box>
  );
};

export default ContradictingLabelsPanel;
