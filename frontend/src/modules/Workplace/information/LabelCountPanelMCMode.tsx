import React from "react";
import { useAppSelector } from "../../../customHooks/useRedux";
import { useTheme } from "@mui/material/styles";
import { Box, Stack, Typography } from "@mui/material";
import { TabPanel } from "./TabPanel";
import { StatsContainer } from "./StatsContainer";
import { LabelCountTabs } from "./LabelCountTabs";
import classes from "./WorkspaceInfo.module.css";

export const LabelCountPanelMCMode = () => {
  const [tabValue, setTabValue] = React.useState(0);
  const labelCount = useAppSelector((state) => state.workspace.labelCount);
  const categories = useAppSelector((state) => state.workspace.categories);
  return (
    <Box>
      <LabelCountTabs tabValue={tabValue} setTabValue={setTabValue} />
      <Box sx={{ width: "100%" }}>
        <TabPanel
          className={classes.entries_tab}
          value={tabValue}
          index={0}
          sx={{
            maxHeight: "200px",
            overflowY: "scroll",
            scrollbarWidth: "thin",
            scrollbarColor: "#6b6b6b #2b2b2b",
            "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
              backgroundColor: "#2b2b2b",
            },
            "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
              borderRadius: 8,
              backgroundColor: "#6b6b6b",
              minHeight: 24,
              border: "3px solid #2b2b2b",
            },
            "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus":
              {
                backgroundColor: "#959595",
              },
            "&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active":
              {
                backgroundColor: "#959595",
              },
            "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover":
              {
                backgroundColor: "#959595",
              },
            "&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner": {
              backgroundColor: "#2b2b2b",
            },
          }}
        >
          <Stack spacing={0}>
            {categories.map((c, i) => (
              <StatsContainer key={i}>
                <Typography>
                  <strong>{c.category_name}</strong>
                </Typography>
                <Typography
                  sx={{
                    color: 4 ? "#8ccad9" : "#fff",
                  }}
                >
                  {/* <strong>{labelCount[c.category_id.toString()]}</strong> */}

                  <strong>
                    {(labelCount as { [key: string]: number })[
                      c.category_id.toString()
                    ] || 0}
                  </strong>
                </Typography>
              </StatsContainer>
            ))}
            <StatsContainer>
              <Typography>
                <strong>Total</strong>
              </Typography>
              <Typography>
                <strong>
                  {Object.values(labelCount).reduce(
                    (partialSum, a) => partialSum + a,
                    0
                  )}
                </strong>
              </Typography>
            </StatsContainer>
          </Stack>
        </TabPanel>
      </Box>
    </Box>
  );
};
