import { Badge, Icon, IconButton, Stack, Tooltip } from "@mui/material";
import { PanelIdsEnum } from "../../../const";
import { useAppSelector } from "../../../customHooks/useRedux";
import posPredIcon from "../../../assets/bot.png";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { useFocusNextPositivePrediction } from "../../../customHooks/useFocusNextPositivePrediction";
import classes from "./MainPanel.module.css";

export const NavigatePositivePredictions = () => {
  const documentPositivePredictionIds = useAppSelector(
    (state) =>
      state.workspace.panels.panels[PanelIdsEnum.MAIN_PANEL]
        .documentPositivePredictionIds
  );

  const { focusPreviousPositivePrediction, focusNextPositivePrediction } =
    useFocusNextPositivePrediction();

  return documentPositivePredictionIds !== null ? (
    <Stack direction={"row"} alignItems={"center"}>
      <Tooltip title={"Positive predictions"} placement={"top"}>
        <img
          style={{ width: "32px", height: "32px" }}
          src={posPredIcon}
          alt="Positive prediction icon"
        />
      </Tooltip>

      <Stack direction={"column"} alignItems={"center"}>
        <Tooltip title="Previous previous prediction" placement={"top"} >
          <span>
            <IconButton
             size="small"
              aria-label="next"
              onClick={focusPreviousPositivePrediction}
              disabled={documentPositivePredictionIds.length === 0}
            >
              <KeyboardArrowUpIcon fontSize="inherit" />
            </IconButton>
          </span>
        </Tooltip>

        <span className={classes["notify-badge"]}>
          {documentPositivePredictionIds.length}
        </span>

        <Tooltip title="Next positive prediction">
          <span>
            <IconButton
             size="small"
              aria-label="next"
              onClick={focusNextPositivePrediction}
              disabled={documentPositivePredictionIds.length === 0}
            >
              <KeyboardArrowDownIcon fontSize="inherit" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Stack>
  ) : null;
};
