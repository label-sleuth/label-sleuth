import IconButton from "@mui/material/IconButton";
import classes from "./index.module.css";
import { LabelTypesEnum } from "../../const";
import checking from "../../assets/checking.svg";
import check from "../../assets/check.svg";
import crossing from "../../assets/crossing.svg";
import cross from "../../assets/cross.svg";
import { Tooltip } from "@mui/material";
import { ReactNode } from "react";

export interface TooltipProps {
  title?: NonNullable<ReactNode>;
  arrow?: boolean;
  enterDelay?: number;
  placement?:
    | "bottom-end"
    | "bottom-start"
    | "bottom"
    | "left-end"
    | "left-start"
    | "left"
    | "right-end"
    | "right-start"
    | "right"
    | "top-end"
    | "top-start"
    | "top";
}

interface PosNegButtonsProps {
  userLabel: LabelTypesEnum;
  show?: boolean; // use to force displaying the button, and not conditionally based on whenever it is hovered
  onClick: (e: any) => void;
  tooltipProps?: TooltipProps;
  showContidionally?: boolean;
}

export const PosButton = ({
  onClick,
  show = false,
  userLabel,
  tooltipProps,
  showContidionally = true,
}: PosNegButtonsProps) => {
  if (tooltipProps === undefined) {
    tooltipProps = { title: "" };
  }
  return userLabel === LabelTypesEnum.POS ? (
    <Tooltip {...{ title: "", ...tooltipProps }}>
      <IconButton onClick={onClick} className={classes.label_button}>
        <img className={`${classes.resultbtn} ${classes.label_img}`} loading="eager" src={check} alt="checked" />
      </IconButton>
    </Tooltip>
  ) : show || showContidionally ? (
    <Tooltip {...{ title: "", ...tooltipProps }}>
      <IconButton
        onClick={onClick}
        className={`${classes.label_button} ${!show && showContidionally ? classes.visibility : ""}`}
      >
        <img loading="eager" src={checking} alt="checking" className={classes.label_img} />
      </IconButton>
    </Tooltip>
  ) : null;
};

export const NegButton = ({
  onClick,
  show = false,
  userLabel,
  tooltipProps,
  showContidionally = true,
}: PosNegButtonsProps) => {
  if (tooltipProps === undefined) {
    tooltipProps = { title: "" };
  }
  return userLabel === LabelTypesEnum.NEG ? (
    <Tooltip {...{ title: "", ...tooltipProps }}>
      <IconButton onClick={onClick} className={classes.label_button}>
        <img className={`${classes.resultbtn} ${classes.label_img}`} loading="eager" src={cross} alt="checked" />
      </IconButton>
    </Tooltip>
  ) : show || showContidionally ? (
    <Tooltip {...{ title: "", ...tooltipProps }}>
      <IconButton onClick={onClick} className={classes.label_button}>
        <img
          loading="eager"
          src={crossing}
          alt="checking"
          className={`${classes.label_img} ${!show && showContidionally ? classes.visibility : ""}`}
        />
      </IconButton>
    </Tooltip>
  ) : null;
};
