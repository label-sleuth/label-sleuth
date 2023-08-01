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
import {
  IconButton,
  Collapse,
  AlertTitle,
  Alert,
  Box,
  Typography,
  Link,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import classes from "./WorkspaceInfo.module.css";
import { CustomizableUITextEnum, IterationStatusEnum } from "../../../const";
import { useAppSelector } from "../../../customHooks/useRedux";
import { useNotification } from "../../../utils/notification";
import { toast } from "react-toastify";

export const ModelErrorAlert = () => {
  const [collapsed, setCollapsed] = React.useState(true);

  const modelFailureReason = useAppSelector(
    (state) => state.workspace.modelFailureReason
  );

  const insufficientTrainDataToastMessage = useAppSelector(
    (state) =>
      state.customizableUIText.texts[
        CustomizableUITextEnum.INSUFFICIENT_TRAIN_DATA_TOAST_MESSAGE
      ]
  );

  const insufficientTrainDataDescription = useAppSelector(
    (state) =>
      state.customizableUIText.texts[
        CustomizableUITextEnum.INSUFFICIENT_TRAIN_DATA_DESCRIPTION
      ]
  );

  const { notify } = useNotification();

  React.useEffect(() => {
    if (modelFailureReason === IterationStatusEnum.INSUFFICIENT_TRAIN_DATA) {
      notify(insufficientTrainDataToastMessage, {
        type: toast.TYPE.INFO,
      });
    }
  }, [modelFailureReason, insufficientTrainDataToastMessage, notify]);

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
        severity={
          modelFailureReason === IterationStatusEnum.ERROR
            ? "error"
            : modelFailureReason === IterationStatusEnum.INSUFFICIENT_TRAIN_DATA
            ? "info"
            : "error"
        }
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
            {collapsed ? (
              <KeyboardArrowUpIcon fontSize="inherit" />
            ) : (
              <KeyboardArrowDownIcon fontSize="inherit" />
            )}
          </IconButton>
        }
      >
        <AlertTitle>
          {modelFailureReason === IterationStatusEnum.ERROR
            ? "Model creation failed"
            : modelFailureReason === IterationStatusEnum.INSUFFICIENT_TRAIN_DATA
            ? "Insufficient train data"
            : ""}
        </AlertTitle>
        <Collapse in={collapsed}>
          <Typography sx={{ wordBreak: "break-word", mr: -4, ml: -3 }}>
            {modelFailureReason === IterationStatusEnum.ERROR ? (
              <>
                {
                  "Something went wrong creating the last model. Please ask the system administrator to "
                }

                <Link
                  href="https://github.com/label-sleuth/label-sleuth/issues/new/choose"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {"submit an issue"}
                </Link>
                {
                  ' with the logs located at "logs/label-sleuth.log" inside the Label Sleuth output directory.'
                }
              </>
            ) : modelFailureReason ===
              IterationStatusEnum.INSUFFICIENT_TRAIN_DATA ? (
              insufficientTrainDataDescription
            ) : (
              ""
            )}
          </Typography>
        </Collapse>
      </Alert>
    </Box>
  );
};
