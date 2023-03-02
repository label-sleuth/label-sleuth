import React from "react";
import { useAppSelector } from "../../../customHooks/useRedux";
import { useTheme } from "@mui/material/styles";
import { Box, Stack, Typography } from "@mui/material";
import { TabPanel } from "./TabPanel";
import { StatsContainer } from "./StatsContainer";
import { LabelCountTabs } from "./LabelCountTabs";
import classes from "./WorkspaceInfo.module.css";

export const LabelCountPanel = () => {
  const [tabValue, setTabValue] = React.useState(0);
  const labelCount = useAppSelector((state) => state.workspace.labelCount);
  const curCategory = useAppSelector((state) => state.workspace.curCategory);
  const theme = useTheme();

  React.useEffect(() => {
    setTabValue(0);
  }, [curCategory]);

  return (
    <Box>
      <LabelCountTabs tabValue={tabValue} setTabValue={setTabValue} />
      <Box sx={{ width: "100%", padding: theme.spacing(0, 2) }}>
        <TabPanel className={classes.entries_tab} value={tabValue} index={0}>
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
                <strong>{labelCount.pos + labelCount.neg}</strong>
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
                <Typography sx={{ color: labelCount.weakPos > 0 ? "#8ccad9" : "#fff" }}>
                  <strong>{labelCount.weakPos}</strong>
                </Typography>
              </StatsContainer>
              <StatsContainer>
                <Typography>
                  <strong>Negative</strong>
                </Typography>
                <Typography sx={{ color: labelCount.weakNeg > 0 ? "#ff758f" : "#fff" }}>
                  <strong>{labelCount.weakNeg}</strong>
                </Typography>
              </StatsContainer>
              <StatsContainer>
                <Typography>
                  <strong>Total</strong>
                </Typography>
                <Typography>
                  <strong>{labelCount.weakPos + labelCount.weakNeg}</strong>
                </Typography>
              </StatsContainer>
            </Stack>
          </TabPanel>
        ) : null}
      </Box>
    </Box>
  );
};
