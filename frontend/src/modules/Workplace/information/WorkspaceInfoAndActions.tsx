import { Stack, Typography, Tooltip, Button } from "@mui/material";
import {
  NO_MODEL_AVAILABLE_MSG,
  NEXT_MODEL_TRAINING_MSG,
  CustomizableUITextEnum,
  WorkspaceMode,
} from "../../../const";
import { useTheme } from "@mui/material/styles";
import { LinearWithValueLabel } from "./ModelProgressBar";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { ModelErrorAlert } from "./ModelErrorAlert";
import { Divider } from "./Divider";
import { LabelCountPanel } from "./LabelCountPanel";
import { useAppSelector } from "../../../customHooks/useRedux";
import classes from "./WorkspaceInfo.module.css";
import { useMemo } from "react";

interface WorkspaceInfoAndActionsProps {
  modelVersionSuffix: string | null;
  setDownloadModelDialogOpen: (value: boolean) => void;
  setDownloadLabelsDialogOpen: (value: boolean) => void;
  setUploadLabelsDialogOpen: (value: boolean) => void;
}

export const WorkspaceInfoAndActions = ({
  modelVersionSuffix,
  setDownloadModelDialogOpen,
  setDownloadLabelsDialogOpen,
  setUploadLabelsDialogOpen,
}: WorkspaceInfoAndActionsProps) => {
  const curCategory = useAppSelector((state) => state.workspace.curCategory);
  const modelVersion = useAppSelector((state) => state.workspace.modelVersion);
  const mode = useAppSelector((state) => state.workspace.mode);
  const nextZeroShotModelTrainingMsg = useAppSelector(
    (state) => state.customizableUIText.texts[CustomizableUITextEnum.NEXT_ZERO_SHOT_MODEL_TRAINING_MSG]
  );
  const nextModelShouldBeTraining = useAppSelector(
    (state) => state.workspace.nextModelShouldBeTraining
  );
  const lastModelFailed = useAppSelector(
    (state) => state.workspace.lastModelFailed
  );

  const zeroShotModelIsTraining = useAppSelector(
    (state) => state.workspace.zeroShotModelIsTraining
  );

  const theme = useTheme();

  const toDisplayMessage = useMemo<string>(() => {
    if (zeroShotModelIsTraining && nextZeroShotModelTrainingMsg !== '') {
      return nextZeroShotModelTrainingMsg;
    } else {
      return NEXT_MODEL_TRAINING_MSG;
    }
  }, [zeroShotModelIsTraining, nextZeroShotModelTrainingMsg]);

  return (
    <>
      {curCategory !== null || mode === WorkspaceMode.MULTICLASS ? (
        <Stack style={{ paddingTop: "12px", paddingBottom: "24px" }}>
          <LabelCountPanel />
          <Divider />
          <Stack
            direction="row"
            alignItems="flex-end"
            sx={{
              paddingLeft: 2,
              paddingRight: 0,
              paddingBottom: 1.5,
              paddingTop: 4,
            }}
          >
            {modelVersion && modelVersion > -1 ? (
              <Typography id="model-version" style={{ whiteSpace: "nowrap" }}>
                {"Current model: "}
                <strong>
                  {modelVersion}
                  <sup>{modelVersionSuffix}</sup> version
                </strong>
              </Typography>
            ) : (
              <Typography id="model-version-unavailable">
                {"Current model: "}
                <strong>{NO_MODEL_AVAILABLE_MSG}</strong>
              </Typography>
            )}
            {modelVersion && modelVersion > -1 ? (
              <Tooltip title={"Download model"} placement="top">
                <Button
                  onClick={() => setDownloadModelDialogOpen(true)}
                  startIcon={<FileDownloadOutlinedIcon />}
                  sx={{
                    textTransform: "none",
                    padding: "0 0 0 20px",
                  }}
                />
              </Tooltip>
            ) : null}
          </Stack>
          <LinearWithValueLabel />
          {nextModelShouldBeTraining ? (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-end",
              }}
            >
              <div className={classes.modelStatus}>{toDisplayMessage}</div>
              <div className={classes["dot-pulse"]}></div>
            </div>
          ) : null}
          {lastModelFailed && <ModelErrorAlert />}
        </Stack>
      ) : null}
      <Divider />
      <Stack
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "start",
          padding: theme.spacing("24px", 2),
          flexGrow: "1",
        }}
      >
        <Typography>Workspace labeled data:</Typography>
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
          }}
        >
          <Button
            onClick={() => setDownloadLabelsDialogOpen(true)}
            startIcon={<FileDownloadOutlinedIcon />}
            sx={{ textTransform: "none" }}
          >
            Download
          </Button>
        </Stack>
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
          }}
        >
          <Button
            startIcon={<FileUploadOutlinedIcon />}
            component="label"
            onClick={() => setUploadLabelsDialogOpen(true)}
            sx={{ textTransform: "none" }}
          >
            Upload
          </Button>
        </Stack>
      </Stack>
    </>
  );
};
