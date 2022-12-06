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

import * as React from "react";
import { IconButton, Collapse, AlertTitle, Alert, Box, Typography, Link } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import classes from "./WorkspaceInfo.module.css";

export const ModelErrorAlert = () => {
  const [collapsed, setCollapsed] = React.useState(true);

  return (
    <Box
      sx={{
        pt: 2,
        pl: 2,
        pr: 2,
        mb: -2,
      }}
    >
      <Alert
        severity="error"
        className={classes.alert}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={() => {
              setCollapsed((prevValue) => !prevValue);
            }}
          >
            {collapsed ? <KeyboardArrowUpIcon fontSize="inherit" /> : <KeyboardArrowDownIcon fontSize="inherit" />}
          </IconButton>
        }
      >
        <AlertTitle>Model creation failed</AlertTitle>
        <Collapse in={collapsed}>
          <Typography sx={{ wordBreak: "break-word", mr: -4, ml: -3 }}>
            {"Something went wrong creating the last model. Please ask the system administrator to "}
            <Link
              href="https://github.com/label-sleuth/label-sleuth/issues/new/choose"
              target="_blank"
              rel="noopener noreferrer"
            >
              {"submit an issue"}
            </Link>
            {' with the logs located at "logs/label-sleuth.log" inside the Label Sleuth output directory.'}
          </Typography>
        </Collapse>
      </Alert>
    </Box>
  );
};
