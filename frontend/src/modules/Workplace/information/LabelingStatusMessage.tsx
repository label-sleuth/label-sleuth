import { Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import { WorkspaceMode } from "../../../const";
import { useAppSelector } from "../../../customHooks/useRedux";
import { nonDeletedCategoriesSelector } from "../redux";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export const LabelingStatusMessage = () => {
  const labelCount = useAppSelector((state) => state.workspace.labelCount);
  const nonDeletedCategories = useAppSelector(nonDeletedCategoriesSelector);
  const mode = useAppSelector((state) => state.workspace.mode);
  const nextModelShouldBeTraining = useAppSelector(
    (state) => state.workspace.nextModelShouldBeTraining
  );
  const binaryFirstModelPositiveThreshold = useAppSelector(
    (state) => state.featureFlags.binaryFirstModelPositiveThreshold
  );
  const multiclassPerClassLabelingThreshold = useAppSelector(
    (state) => state.featureFlags.multiclassPerClassLabelingThreshold
  );

  const labelingStatusMessage = useMemo(() => {
    const yetToLabelCount = binaryFirstModelPositiveThreshold - labelCount.pos;
    if (mode === WorkspaceMode.BINARY) {
      if (yetToLabelCount > 0 && !nextModelShouldBeTraining) {
        return `Please label ${
          binaryFirstModelPositiveThreshold - labelCount.pos
        } more ${yetToLabelCount > 1 ? "elements" : "element"} as positive`;
      } else return null;
    }

    if (mode === WorkspaceMode.MULTICLASS) {
      const needToLabelCats: string[] = Object.keys(labelCount)
        .filter((k) =>
          nonDeletedCategories.map((c) => c.category_id.toString()).includes(k)
        )
        .filter(
          (k) =>
            (labelCount as { [key: string]: number })[k] <
            multiclassPerClassLabelingThreshold
        );
      return needToLabelCats.length && !nextModelShouldBeTraining
        ? `${needToLabelCats.length} ${
            needToLabelCats.length > 1 ? "categories" : "category"
          } still didn't reach a minimum recommended of ${multiclassPerClassLabelingThreshold} 
          ${multiclassPerClassLabelingThreshold > 1 ? "samples" : "sample"}`
        : null;
    }
  }, [
    binaryFirstModelPositiveThreshold,
    multiclassPerClassLabelingThreshold,
    labelCount,
    mode,
    nonDeletedCategories,
    nextModelShouldBeTraining,
  ]);
  return labelingStatusMessage ? (
    <Stack
      direction={"row"}
      justifyContent={"center"}
      alignItems={"center"}
      sx={{ mt: 1 }}
    >
      <WarningAmberIcon
        sx={{ color: "gray", width: "20px", height: "25px", mr: 1 }}
      />
      <Typography sx={{ color: "gray" }} variant="caption">
        {labelingStatusMessage}
      </Typography>
    </Stack>
  ) : null;
};
