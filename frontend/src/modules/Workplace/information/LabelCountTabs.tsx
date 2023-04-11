import { useAppSelector } from "../../../customHooks/useRedux";
import { Box, Tabs, Tab, useTheme } from "@mui/material";
import classes from "./WorkspaceInfo.module.css";

interface LabelCountTabsProps {
  tabValue: number;
  setTabValue: (value: number) => void;
}

export const LabelCountTabs = ({ tabValue, setTabValue }: LabelCountTabsProps) => {
  const labelCount = useAppSelector((state) => state.workspace.labelCount);
  const theme = useTheme();

  const handleChange = (event: React.SyntheticEvent<Element, Event>, newValue: number) => {
    setTabValue(newValue);
  };

  const a11yProps = (index: number) => ({
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  });

  return (
    <Box sx={{ borderBottom: 1, borderColor: "#393939" }}>
      <Tabs
        className={classes.tabroot}
        value={tabValue}
        onChange={handleChange}
        aria-label="workspace toggle tab"
        variant="fullWidth"
        sx={{ padding: theme.spacing(0, 2) }}
      >
        <Tab label="User labels" {...a11yProps(0)} className={classes.tabs} sx={{ textTransform: "none" }} />
        {labelCount.weakPos > 0 || labelCount.weakNeg > 0 ? (
          <Tab
            label="System-generated labels"
            {...a11yProps(1)}
            className={classes.tabs}
            sx={{ textTransform: "none" }}
          />
        ) : null}
      </Tabs>
    </Box>
  );
};
