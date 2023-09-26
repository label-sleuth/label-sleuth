import React from "react";
import { useAppSelector } from "../../../customHooks/useRedux";
import { Box, Divider, Stack, Typography } from "@mui/material";
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
          value={tabValue}
          index={0}
          sx={{ backgroundColor: "#393939", borderRadius: "0 0 2px 2px;" }}
        >
          <>
            <Stack
              sx={{
                pt: 1.5,
                px: 2,
                pb: 2,
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
              {categories.map((c, i) => (
                <StatsContainer key={i}>
                  <Typography>{c.category_name}</Typography>
                  <Typography
                    sx={{
                      color: "#fff",
                    }}
                  >
                    {/* <strong>{labelCount[c.category_id.toString()]}</strong> */}

                    {(labelCount as { [key: string]: number })[
                      c.category_id.toString()
                    ] || 0}
                  </Typography>
                </StatsContainer>
              ))}
            </Stack>
            <Divider sx={{ borderTop: "1px solid #5f5d5d"}} />
            <StatsContainer sx={{ mr: 4, ml: 2, py: 1.5 }}>
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
          </>
        </TabPanel>
      </Box>
    </Box>
  );
};
