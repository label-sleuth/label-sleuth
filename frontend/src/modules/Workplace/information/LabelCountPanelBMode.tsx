import React, { useMemo } from "react";
import { useAppSelector } from "../../../customHooks/useRedux";
import { useTheme } from "@mui/material/styles";
import { Box, Stack, Typography } from "@mui/material";
import { TabPanel } from "./TabPanel";
import { StatsContainer } from "./StatsContainer";
import { LabelCountTabs } from "./LabelCountTabs";
import classes from "./WorkspaceInfo.module.css";

export const LabelCountPanelBMode = () => {
  const [tabValue, setTabValue] = React.useState(0);
  const labelCount = useAppSelector((state) => state.workspace.labelCount);
  const curCategory = useAppSelector((state) => state.workspace.curCategory);
  const theme = useTheme();

  React.useEffect(() => {
    setTabValue(0);
  }, [curCategory]);

  const totalStrongLabels = useMemo(
    () =>
      labelCount.neg !== undefined && labelCount.pos !== undefined
        ? labelCount.neg + labelCount.pos
        : undefined,
    [labelCount]
  );

  const totalWeakLabels = useMemo(
    () =>
      labelCount.weakNeg !== undefined && labelCount.weakPos !== undefined
        ? labelCount.weakNeg + labelCount.weakPos
        : undefined,
    [labelCount]
  );

  return (
    <Box>
      <LabelCountTabs tabValue={tabValue} setTabValue={setTabValue} />
      <Box sx={{ width: "100%" }}>
        <TabPanel
          value={tabValue}
          index={0}
          sx={{ backgroundColor: "#393939", borderRadius: "0 0 2px 2px;", p: 2 }}
        >
          <Stack spacing={0}>
            <StatsContainer>
              <Typography>
                <strong>Positive</strong>
              </Typography>
              <Typography
                sx={{
                  color: labelCount.pos > 0 ? "#8ccad9" : "#fff",
                }}
              >
                <strong>{labelCount.pos}</strong>
              </Typography>
            </StatsContainer>
            <StatsContainer>
              <Typography>
                <strong>Negative</strong>
              </Typography>
              <Typography
                sx={{
                  color: labelCount.neg > 0 ? "#ff758f" : "#fff",
                }}
              >
                <strong>{labelCount.neg}</strong>
              </Typography>
            </StatsContainer>
            <StatsContainer>
              <Typography>
                <strong>Total</strong>
              </Typography>
              <Typography>
                <strong>{totalStrongLabels}</strong>
              </Typography>
            </StatsContainer>
          </Stack>
        </TabPanel>
        {labelCount.weakPos > 0 || labelCount.weakNeg > 0 ? (
          <TabPanel className={classes.entries_tab} value={tabValue} index={1}>
            <Stack spacing={0}>
              <StatsContainer>
                <Typography>
                  <strong>Positive</strong>
                </Typography>
                <Typography
                  sx={{ color: labelCount.weakPos > 0 ? "#8ccad9" : "#fff" }}
                >
                  <strong>{labelCount.weakPos}</strong>
                </Typography>
              </StatsContainer>
              <StatsContainer>
                <Typography>
                  <strong>Negative</strong>
                </Typography>
                <Typography
                  sx={{ color: labelCount.weakNeg > 0 ? "#ff758f" : "#fff" }}
                >
                  <strong>{labelCount.weakNeg}</strong>
                </Typography>
              </StatsContainer>
              <StatsContainer>
                <Typography>
                  <strong>Total</strong>
                </Typography>
                <Typography>
                  <strong>{totalWeakLabels}</strong>
                </Typography>
              </StatsContainer>
            </Stack>
          </TabPanel>
        ) : null}
      </Box>
    </Box>
  );
};
