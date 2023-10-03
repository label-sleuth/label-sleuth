import { Box, IconButton, SvgIcon, SxProps, Tooltip } from "@mui/material";
import React, { FC, useMemo } from "react";
import { APPBAR_HEIGHT } from "../../const";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PersonIcon from "@mui/icons-material/Person";
import { ReactComponent as Logo } from "../../assets/sleuth_black.svg";
import { badgePalettes } from "../../utils/utils";
import { Category } from "../../global";

interface ILabelColor {
  textColor: string;
  iconColor: string;
  borderColor: string;
  backgroundColor: string;
  lighterBackgroundColor: string;
  hoverColor: string;
}

interface CategoryBadgeProps {
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
  category: Category;
}

export const CategoryBadge: FC<CategoryBadgeProps> = ({
  category,
  sx,
  onRemoveClick,
  hideTooltip,
  selectable = false,
  onSelect,
  onUnselect,
  selected,
  isUserLabel,
  isModelPrediction,
  onClick,
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

  const colorDesign: ILabelColor | null = useMemo(() => {
    // setting green as default but that should never happen
    const palette = category.color?.palette || badgePalettes["green"];
    return {
      textColor: palette[700],
      iconColor: palette[600],
      borderColor: palette[100],
      backgroundColor: palette[100],
      lighterBackgroundColor: palette[50],
      hoverColor: palette[200],
    };
  }, [category]);

  return (
    <Tooltip title={hideTooltip ? "" : category.category_name}>
      <Box
        sx={{
          display: "inline-flex",
          justifyContent: "center",
          alignItems: "center",
          color: colorDesign.textColor,
          borderColor: colorDesign.borderColor,
          backgroundColor: colorDesign.backgroundColor,
          // eslint complaints about &:hover having no effect but it actually has
          // eslint-disable-next-line
          ["&:hover"]: {
            backgroundColor: colorDesign.hoverColor,
          },
          cursor: "pointer",
          borderRadius: "14px",
          borderStyle: selectable ? "dashed" : "solid",
          borderWidth: "1px",
          px: 0.5,
          py: 0.2,
          maxHeight: APPBAR_HEIGHT - 20,
          maxWidth: "150px",
          fontSize: "0.75rem",
          fontWeight: 425,
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
        <span>{`${category.category_name} ${
          category.deleted ? "(deleted)" : ""
        }`}</span>
        {onRemoveClick ? (
          <Tooltip title={"Remove"}>
            <IconButton
              aria-label="delete"
              onClick={() =>
                onRemoveClick &&
                category.category_name &&
                onRemoveClick(category.category_name)
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
