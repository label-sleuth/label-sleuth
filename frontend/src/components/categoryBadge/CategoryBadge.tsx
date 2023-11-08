import {
  Box,
  IconButton,
  Stack,
  SvgIcon,
  SxProps,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { FC, useMemo } from "react";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { ReactComponent as PredictionLogo } from "../../assets/PipeOnly.svg";
import { ReactComponent as UserLabelLogo } from "../../assets/UserOnly.svg";
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
      <Stack
        direction={"row"}
        sx={{
          display: "inline-flex",
          justifyContent: "center",
          alignItems: "center",
          ...sx,
        }}
      >
        {isModelPrediction && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              backgroundColor: colorDesign.backgroundColor,
              mr: 0.5,
              width: "24px",
              height: "24px",
            }}
          >
            <Tooltip title={"Model prediction"}>
              <SvgIcon
                sx={{
                  fontSize: "16px",
                  fill: colorDesign.iconColor,
                  ml: -0.9,
                }}
                component={PredictionLogo}
                inheritViewBox
              />
            </Tooltip>
          </Box>
        )}
        {isUserLabel && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              backgroundColor: colorDesign.backgroundColor,
              mr: 0.5,
              ml: isModelPrediction ? -1.1 : 0,
              width: "24px",
              height: "24px",
            }}
          >
            <Tooltip title={"User Label"}>
              <SvgIcon
                sx={{
                  fontSize: "18px",
                  fill: colorDesign.iconColor,
                  color: colorDesign.iconColor,
                  mb: -0.7,
                }}
                fill={colorDesign.iconColor}
                component={UserLabelLogo}
                inheritViewBox
              />
            </Tooltip>
          </Box>
        )}
        <Box
          sx={{
            display: "inline-flex",
            color: colorDesign.textColor,
            borderColor: colorDesign.borderColor,
            backgroundColor:
              (selectable && selected) || !selectable
                ? colorDesign.backgroundColor
                : colorDesign.lighterBackgroundColor,
            boxShadow:
              selectable && selected
                ? `0 0 8px ${colorDesign.textColor}`
                : "none",
            // eslint complaints about &:hover having no effect but it actually has
            // eslint-disable-next-line
            ["&:hover"]: {
              backgroundColor: selectable ? colorDesign.hoverColor : "none",
            },
            cursor: selectable ? "pointer" : "default",
            borderRadius: "14px",
            borderStyle: selectable && !selected ? "dashed" : "solid",
            borderWidth: "1px",
            px: 0.5,
            py: 0.2,
            maxWidth: "150px",
          }}
          onClick={onClickAll}
        >
          <Typography
            component={"span"}
            sx={{
              maxWidth: isUserLabel || isModelPrediction ? "130px" : "150px",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              cursor: selectable ? "pointer" : "default",
              fontSize: "0.75rem",
              fontWeight: 425,
            }}
          >{`${category.category_name} ${
            category.deleted ? "(deleted)" : ""
          }`}</Typography>
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
      </Stack>
    </Tooltip>
  );
};
