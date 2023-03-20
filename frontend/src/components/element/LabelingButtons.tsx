import { Stack } from "@mui/material";
import { NegButton, TooltipProps } from "../labelButtons/LabelButtons";
import { PosButton } from "../labelButtons/LabelButtons";
import { Element } from "../../global";
import { LabelCategoriesMenuButton } from "./LabelNonCurrentCatMenu";
import classes from "./Element.module.css";
import React from "react";

interface LabelingButtonsProps {
  isElementFocused?: boolean;
  labelMenuOpen: boolean;
  labelMenuOpenAnchorEl: any;
  setLabelMenuOpenAnchorEl: any;
  element: Element;
  handlePosLabelAction: any;
  handleNegLabelAction: any;
  hideButtons?: boolean;
  sx?: { [key: string]: string | number };
  posTooltipProps?: TooltipProps;
  negTooltipProps?: TooltipProps;
  otherCatsTooltipProps?: TooltipProps;
}
export const LabelingButtons = ({
  isElementFocused = false,
  labelMenuOpen,
  setLabelMenuOpenAnchorEl,
  element,
  handlePosLabelAction,
  handleNegLabelAction,
  hideButtons = false,
  sx,
  posTooltipProps,
  negTooltipProps,
  otherCatsTooltipProps,
}: LabelingButtonsProps) => {
  return !!!hideButtons ? (
    <Stack
      sx={{ justifyContent: "flex-end", alignItems: "center", ...sx }}
      direction="row"
      spacing={0}
      className={classes.checking_buttons}
    >
      <LabelCategoriesMenuButton
        setAnchorEl={setLabelMenuOpenAnchorEl}
        tooltipProps={otherCatsTooltipProps}
        labelMenuOpen={labelMenuOpen}
      />
      <NegButton
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          handleNegLabelAction(element);
        }}
        userLabel={element.userLabel}
        show={labelMenuOpen || isElementFocused}
        tooltipProps={negTooltipProps}
      />
      <PosButton
        onClick={(e: React.UIEvent) => {
          e.stopPropagation();
          e.preventDefault();
          handlePosLabelAction(element);
        }}
        userLabel={element.userLabel}
        show={labelMenuOpen || isElementFocused}
        tooltipProps={posTooltipProps}
      />
    </Stack>
  ) : null;
};
