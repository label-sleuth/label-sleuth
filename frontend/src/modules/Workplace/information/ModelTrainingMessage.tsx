import { Box } from "@mui/material";
import { useMemo } from "react";
import {
  CustomizableUITextEnum,
  NEXT_MODEL_TRAINING_MSG,
} from "../../../const";
import { useAppSelector } from "../../../customHooks/useRedux";
import classes from "./WorkspaceInfo.module.css";

export const ModelTrainingMessage = () => {
  const nextZeroShotModelTrainingMsg = useAppSelector(
    (state) =>
      state.customizableUIText.texts[
        CustomizableUITextEnum.NEXT_ZERO_SHOT_MODEL_TRAINING_MSG
      ]
  );
  const nextModelShouldBeTraining = useAppSelector(
    (state) => state.workspace.nextModelShouldBeTraining
  );

  const zeroShotModelIsTraining = useAppSelector(
    (state) => state.workspace.zeroShotModelIsTraining
  );

  const toDisplayMessage = useMemo<string>(() => {
    if (zeroShotModelIsTraining && nextZeroShotModelTrainingMsg !== "") {
      return nextZeroShotModelTrainingMsg;
    } else {
      return NEXT_MODEL_TRAINING_MSG;
    }
  }, [zeroShotModelIsTraining, nextZeroShotModelTrainingMsg]);

  return nextModelShouldBeTraining ? (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-end",
      }}
    >
      <div className={classes.modelStatus}>{toDisplayMessage}</div>
      <div className={classes["dot-pulse"]}></div>
    </Box>
  ) : null;
};
