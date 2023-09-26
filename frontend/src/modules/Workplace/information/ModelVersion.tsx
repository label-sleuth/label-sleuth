import React, { useMemo } from "react";
import { NO_MODEL_AVAILABLE_MSG } from "../../../const";
import { useAppSelector } from "../../../customHooks/useRedux";
import { getOrdinalSuffix } from "../../../utils/utils";
import { Typography } from "@mui/material";

export const ModelVersion = () => {
  const modelVersion = useAppSelector((state) => state.workspace.modelVersion);

  const modelVersionSuffix = useMemo(
    () => (modelVersion !== null ? getOrdinalSuffix(modelVersion) : null),
    [modelVersion]
  );

  return modelVersion && modelVersion > -1 ? (
    <Typography id="model-version" sx={{ whiteSpace: "nowrap", fontSize: "1rem" }}>
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
  );
};
