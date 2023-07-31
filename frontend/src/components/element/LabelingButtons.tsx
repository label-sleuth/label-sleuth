import { Stack } from "@mui/material";
import { NegButton, TooltipProps } from "../labelButtons/LabelButtons";
import { PosButton } from "../labelButtons/LabelButtons";
import { Element } from "../../global";
import { LabelCategoriesMenuButton } from "./LabelNonCurrentCatMenu";
import classes from "./Element.module.css";
import React from "react";
import { PanelIdsEnum } from "../../const";

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
  panelId: PanelIdsEnum;
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
  panelId,
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
        element={element}
      />
      <NegButton
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          handleNegLabelAction(element, panelId);
        }}
        userLabel={element.userLabel}
        show={labelMenuOpen || isElementFocused}
        tooltipProps={negTooltipProps}
      />
      <PosButton
        onClick={(e: React.UIEvent) => {
          e.stopPropagation();
          e.preventDefault();
          handlePosLabelAction(element, panelId);
        }}
        userLabel={element.userLabel}
        show={labelMenuOpen || isElementFocused}
        tooltipProps={posTooltipProps}
      />
    </Stack>
  ) : null;
};
