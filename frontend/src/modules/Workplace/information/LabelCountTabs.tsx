import { useAppSelector } from "../../../customHooks/useRedux";
import { Box, Tabs, Tab, Typography, Stack } from "@mui/material";
import classes from "./WorkspaceInfo.module.css";
import NorthIcon from "@mui/icons-material/North";
import SouthIcon from "@mui/icons-material/South";
import { returnByMode } from "../../../utils/utils";
import { useCallback } from "react";

interface LabelCountTabsProps {
  tabValue: number;
  setTabValue: (value: number) => void;
  sortingAscendingOrder?: boolean;
  setSortingAscendingOrder?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const LabelCountTabs = ({
  tabValue,
  setTabValue,
  sortingAscendingOrder = false,
  setSortingAscendingOrder,
}: LabelCountTabsProps) => {
  const labelCount = useAppSelector((state) => state.workspace.labelCount);
  const mode = useAppSelector((state) => state.workspace.mode);

  const handleChange = (
    event: React.SyntheticEvent<Element, Event>,
    newValue: number
  ) => {
    setTabValue(newValue);
  };

  const onSortClick = useCallback(() => {
    setSortingAscendingOrder &&
      setSortingAscendingOrder(!sortingAscendingOrder);
  }, [sortingAscendingOrder, setSortingAscendingOrder]);

  const a11yProps = (index: number) => ({
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  });

  return (
    <Box sx={{ borderBottom: 1, borderColor: "#393939", position: "relative" }}>
      <Tabs
        className={classes.tabroot}
        value={tabValue}
        onChange={handleChange}
        aria-label="workspace toggle tab"
        variant="fullWidth"
      >
        <Tab
          label="User labels"
          {...a11yProps(0)}
          className={classes.tabs}
          sx={{ textTransform: "none", pl: 0, alignItems: "flex-start" }}
        />
        {labelCount.weakPos > 0 || labelCount.weakNeg > 0 ? (
          <Tab
            label="System-generated labels"
            {...a11yProps(1)}
            className={classes.tabs}
            sx={{ textTransform: "none" }}
          />
        ) : null}
      </Tabs>
      {returnByMode(
        null,
        <Stack
          direction={"row"}
          sx={{
            position: "absolute",
            right: "6px",
            top: "12px",
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
          }}
          onClick={onSortClick}
        >
          <Typography
            sx={{ color: "gray", userSelect: "none !important" }}
            variant="caption"
          >
            {"Sort"}
          </Typography>
          {sortingAscendingOrder ? (
            <NorthIcon sx={{ color: "gray", fontSize: "16px" }} />
          ) : (
            <SouthIcon sx={{ color: "gray", fontSize: "16px" }} />
          )}
        </Stack>,
        mode
      )}
    </Box>
  );
};
