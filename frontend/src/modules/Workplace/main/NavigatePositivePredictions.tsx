import {
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { PanelIdsEnum } from "../../../const";
import { useAppSelector } from "../../../customHooks/useRedux";
import posPredIcon from "../../../assets/bot.png";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { useFocusNextPositivePrediction } from "../../../customHooks/useFocusNextPositivePrediction";
import { Keyboard } from "../../../components/Keyboard";
import { TooltipTitleWithShortcut } from "../../../components/element/TooltipTitleWithShortcut";

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
      <Tooltip
        title={
          <TooltipTitleWithShortcut
            title={"Focus previous"}
            icon={<Keyboard kbd={"o"} />}
          />
        }
      >
        <span>
          <IconButton
            sx={{ fontSize: "1rem", padding: "0px" }}
            aria-label="next"
            onClick={focusPreviousPositivePrediction}
            disabled={documentPositivePredictionIds.length === 0}
          >
            <KeyboardArrowLeftIcon fontSize="inherit" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={"Positive predictions"}>
        <Stack direction={"row"} alignItems={"center"}>
          <img
            style={{ opacity: 0.5, width: "18px", height: "18px" }}
            src={posPredIcon}
            alt="Positive prediction icon"
          />

          <Typography
            sx={{
              marginLeft: "5px",
              fontSize: "14px",
              lineHeight: "14px",
              opacity: 0.5,
            }}
          >
            {documentPositivePredictionIds.length}
          </Typography>
        </Stack>
      </Tooltip>

      <Tooltip
        title={
          <TooltipTitleWithShortcut
            title={"Focus next"}
            icon={<Keyboard kbd={"p"} />}
          />
        }
      >
        <span>
          <IconButton
            sx={{ fontSize: "1rem", padding: "2px" }}
            aria-label="next"
            onClick={focusNextPositivePrediction}
            disabled={documentPositivePredictionIds.length === 0}
          >
            <KeyboardArrowRightIcon fontSize="inherit" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  ) : null;
};
