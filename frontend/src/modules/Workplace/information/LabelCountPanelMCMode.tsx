import React, { useCallback, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../customHooks/useRedux";
import { Box, Divider, Stack, Typography } from "@mui/material";
import { TabPanel } from "./TabPanel";
import { StatsContainer } from "./StatsContainer";
import { LabelCountTabs } from "./LabelCountTabs";
import { Category } from "../../../global";
import { PanelIdsEnum } from "../../../const";
import {
  nonDeletedCategoriesSelector,
  setActivePanel,
  setPanelFilters,
} from "../redux";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export const LabelCountPanelMCMode = () => {
  const [tabValue, setTabValue] = React.useState(0);
  const labelCount = useAppSelector((state) => state.workspace.labelCount);
  const [sortingAscendingOrder, setSortingAscendingOrder] = useState(false);
  const nonDeletedCategories = useAppSelector(nonDeletedCategoriesSelector);
  const activePanelId = useAppSelector(
    (state) => state.workspace.panels.activePanelId
  );
  const multiclassPerClassLabelingThreshold = useAppSelector(
    (state) => state.featureFlags.multiclassPerClassLabelingThreshold
  );

  const categoriesSorted = useMemo(() => {
    const sorted = [...nonDeletedCategories];
    sorted.sort((a, b) => {
      const aLabelCount =
        (labelCount as { [key: string]: number })[a.category_id.toString()] ||
        0;
      const bLabelCount =
        (labelCount as { [key: string]: number })[b.category_id.toString()] ||
        0;
      return sortingAscendingOrder
        ? aLabelCount === bLabelCount
          ? 0
          : aLabelCount > bLabelCount
          ? 1
          : -1
        : aLabelCount === bLabelCount
        ? 0
        : aLabelCount > bLabelCount
        ? -1
        : 1;
    });
    return sorted;
  }, [nonDeletedCategories, sortingAscendingOrder, labelCount]);

  const dispatch = useAppDispatch();

  // sidebar user label panels link
  const onCategoryClick = useCallback(
    (category: Category) => {
      if (activePanelId !== PanelIdsEnum.USER_LABELS) {
        dispatch(setActivePanel(PanelIdsEnum.USER_LABELS));
      }
      dispatch(
        setPanelFilters({
          panelId: PanelIdsEnum.USER_LABELS,
          filters: { value: category.category_id.toString() },
        })
      );
    },
    [activePanelId, dispatch]
  );

  return (
    <Box>
      <LabelCountTabs
        sortingAscendingOrder={sortingAscendingOrder}
        setSortingAscendingOrder={setSortingAscendingOrder}
        tabValue={tabValue}
        setTabValue={setTabValue}
      />
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
                maxHeight: "150px",
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
              {categoriesSorted.map((c, i) => (
                <StatsContainer key={i}>
                  <Typography
                    onClick={() => onCategoryClick(c)}
                    component={"div"}
                    sx={{
                      cursor: "pointer",
                    }}
                  >
                    {c.category_name}
                  </Typography>
                  <Stack direction={"row"} alignItems={"center"}>
                    {(labelCount as { [key: string]: number })[c.category_id.toString()] <
                    multiclassPerClassLabelingThreshold ? (
                      <WarningAmberIcon
                        sx={{
                          color: "gray",
                          width: "15px",
                          height: "20px",
                          mr: 1,
                        }}
                      />
                    ) : null}

                    <Typography
                      sx={{
                        color: "#fff",
                      }}
                    >
                      {(labelCount as { [key: string]: number })[
                        c.category_id.toString()
                      ] || 0}
                    </Typography>
                  </Stack>
                </StatsContainer>
              ))}
            </Stack>
            <Divider sx={{ borderTop: "1px solid #5f5d5d" }} />
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
