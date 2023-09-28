import React, { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../customHooks/useRedux";
import { useTheme } from "@mui/material/styles";
import { Box, Stack, Typography } from "@mui/material";
import { TabPanel } from "./TabPanel";
import { StatsContainer } from "./StatsContainer";
import { LabelCountTabs } from "./LabelCountTabs";
import classes from "./WorkspaceInfo.module.css";
import { LabelTypesEnum, PanelIdsEnum } from "../../../const";
import { setActivePanel, setPanelFilters } from "../redux";

export const LabelCountPanelBMode = () => {
  const [tabValue, setTabValue] = React.useState(0);
  const labelCount = useAppSelector((state) => state.workspace.labelCount);
  const curCategory = useAppSelector((state) => state.workspace.curCategory);
  const activePanelId = useAppSelector(
    (state) => state.workspace.panels.activePanelId
  );

  const dispatch = useAppDispatch();

  // sidebar user label panels link
  const onLabelTypeClick = useCallback(
    (labelType: LabelTypesEnum) => {
      if (activePanelId !== PanelIdsEnum.USER_LABELS) {
        dispatch(setActivePanel(PanelIdsEnum.USER_LABELS));
      }
      dispatch(
        setPanelFilters({
          panelId: PanelIdsEnum.USER_LABELS,
          filters: { value: labelType },
        })
      );
    },
    [activePanelId, dispatch]
  );

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
          sx={{
            backgroundColor: "#393939",
            borderRadius: "0 0 2px 2px;",
            p: 2,
          }}
        >
          <Stack spacing={0}>
            <StatsContainer>
              <Typography
                onClick={() => onLabelTypeClick(LabelTypesEnum.POS)}
                sx={{
                  cursor: "pointer",
                }}
                component={"div"}
              >
                Positive
              </Typography>
              <Typography
                sx={{
                  color: labelCount.pos > 0 ? "#8ccad9" : "#fff",
                }}
              >
                {labelCount.pos}
              </Typography>
            </StatsContainer>
            <StatsContainer>
              <Typography
                sx={{
                  cursor: "pointer",
                }}
                onClick={() => onLabelTypeClick(LabelTypesEnum.NEG)}
                component={"div"}
              >
                Negative
              </Typography>
              <Typography
                sx={{
                  color: labelCount.neg > 0 ? "#ff758f" : "#fff",
                }}
              >
                {labelCount.neg}
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
