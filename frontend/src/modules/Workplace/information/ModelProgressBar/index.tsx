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

import { useAppSelector } from "../../../../customHooks/useRedux";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export const LinearWithValueLabel = () => {
  const modelUpdateProgress = useAppSelector((state) => state.workspace.modelUpdateProgress);

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", pl: "16px", pr: "16px" }}>
        <Box sx={{ width: "100%", mr: 1 }}>
          <LinearProgress variant="determinate" value={modelUpdateProgress} />
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            style={{
              textAlign: "right",
              color: "#fff",
              fontSize: "12px",
            }}
          >{`${Math.round(modelUpdateProgress)}%`}</Typography>
        </Box>
      </Box>
    </Box>
  );
};
