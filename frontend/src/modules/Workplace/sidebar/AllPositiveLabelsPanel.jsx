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
import { panelIds } from "../../../const";

const AllPositiveLabelsPanel = () => {
  const elements = useSelector((state) => state.workspace.panels[panelIds.POSITIVE_LABELS].elements);

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
          <strong>Positive labels</strong>
        </p>
      </Box>
      {!elements || elements.length === 0 ? (
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
          {`You didn't label any elements as positive so far`}
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
          {`These are all the examples labeled by you as positive`}
        </Typography>
      )}
      <Box className={classes["search-results"]} sx={{ mt: 2 }}>
        {Object.values(elements).map((element, i) => {
          return (
            <Element
              key={element.id}
              element={element}
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default AllPositiveLabelsPanel;
