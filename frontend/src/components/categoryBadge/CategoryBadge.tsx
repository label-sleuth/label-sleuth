import { Box, IconButton, SvgIcon, SxProps, Tooltip } from "@mui/material";
import React, { FC, useMemo } from "react";
import { APPBAR_HEIGHT } from "../../const";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PersonIcon from "@mui/icons-material/Person";
import { ReactComponent as Logo } from "../../assets/sleuth_black.svg";
import { badgePalettes, getRandomColor } from "../../utils/utils";
import { BadgeColor } from "../../global";

interface ILabelColor {
  textColor: string;
  iconColor: string;
  borderColor: string;
  backgroundColor: string;
  lighterBackgroundColor: string;
  hoverColor: string;
}

interface CategoryBadgeProps {
  color?: BadgeColor;
  categoryName?: string;
  sx?: SxProps;
  onRemoveClick?: (categoryName: string) => void;
  hideTooltip?: boolean;
  selectable?: boolean;
  onSelect?: () => void;
  onUnselect?: () => void;
  isUserLabel?: boolean;
  isModelPrediction?: boolean;
  selected?: boolean;
  onClick?: (e: React.UIEvent) => void;
}

export const CategoryBadge: FC<CategoryBadgeProps> = ({
  color,
  categoryName,
  sx,
  onRemoveClick,
  hideTooltip,
  selectable = false,
  onSelect,
  onUnselect,
  selected,
  isUserLabel,
  isModelPrediction,
  onClick
}) => {

  const onClickAll = (e: React.UIEvent) => {
    if (selectable) {
      if (selected) {
        onUnselect && onUnselect();
      } else {
        onSelect && onSelect();
      }
    }
    onClick && onClick(e);
  };

  const finalColor = useMemo(() => {
    return color?.name || getRandomColor();
  }, [color]);

  const colorDesign: ILabelColor | null = useMemo(() => {
    // setting green as default but that should never happen
    const palette = color?.palette || badgePalettes['green']; 
    return {
      textColor: palette[700],
      iconColor: palette[600],
      borderColor: palette[300],
      backgroundColor: palette[100],
      lighterBackgroundColor: palette[50],
      hoverColor: palette[200],
    };
  }, [color]);

  return (
    <Tooltip title={hideTooltip ? "" : finalColor}>
      <Box
        sx={{
          display: "inline-flex",
          justifyContent: "center",
          alignItems: "center",
          color: colorDesign.textColor,
          borderColor: colorDesign.borderColor,
          backgroundColor:
            selectable && selected
              ? colorDesign.backgroundColor
              : selectable
              ? "white"
              : colorDesign.backgroundColor,
            // eslint complaints about &:hover having no effect but it actually has
            // eslint-disable-next-line
          ["&:hover"]: {
            backgroundColor:
              selectable && selected
                ? colorDesign.hoverColor
                : colorDesign.lighterBackgroundColor,
          },
          cursor: "pointer",
          borderRadius: "4px",
          borderStyle: selectable ? "dashed" : "solid",
          borderWidth: "1px",
          px: 0.5,
          py: 0.2,
          maxHeight: APPBAR_HEIGHT - 20,
          maxWidth: "150px",
          fontSize: "0.75rem",
          ...sx,
        }}
        onClick={onClickAll}
      >
        {isUserLabel ? (
          <Tooltip title={"User label"}>
            <PersonIcon
              sx={{
                width: "14px",
                height: "14px",
                color: colorDesign.iconColor,
                my: 0,
                mr: 0.5,
                mt: 0.2,
              }}
            />
          </Tooltip>
        ) : isModelPrediction ? (
          <SvgIcon
            sx={{
              fontSize: "12px",
              fill: colorDesign.iconColor,
              my: 0,
              mr: 0.5,
              mt: 0.2,
            }}
            component={Logo}
            htmlColor={colorDesign.iconColor}
            //color={colorDesign.iconColor}
            inheritViewBox
          />
        ) : null}
        <span>{categoryName || finalColor}</span>
        {onRemoveClick ? (
          <Tooltip title={"Remove"}>
            <IconButton
              aria-label="delete"
              onClick={() =>
                onRemoveClick && categoryName && onRemoveClick(categoryName)
              }
              sx={{ pl: 0.5, py: 0, pr: 0 }}
            >
              <DeleteOutlineIcon
                sx={{
                  p: 0,
                  width: "16px",
                  height: "16px",
                  color: colorDesign.iconColor,
                }}
              />
            </IconButton>
          </Tooltip>
        ) : null}
      </Box>
    </Tooltip>
  );
};
