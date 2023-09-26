import { Stack, Typography, Tooltip, Button } from "@mui/material";
import {
  NEXT_MODEL_TRAINING_MSG,
  CustomizableUITextEnum,
  WorkspaceMode,
} from "../../../const";
import { useTheme } from "@mui/material/styles";
import { Divider } from "./Divider";
import { LabelCountPanel } from "./LabelCountPanel";
import { useAppSelector } from "../../../customHooks/useRedux";
import { useMemo } from "react";
import { ModelStatus } from "./ModelStatus";

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

  return (
    <>
      {curCategory !== null || mode === WorkspaceMode.MULTICLASS ? (
        <>
          <LabelCountPanel />
          <Divider sx={{ mt: 1, mb: 3 }} />
          <ModelStatus />
        </>
      ) : null}
      <Divider sx={{ mt: 4 }} />
      
    </>
  );
};
