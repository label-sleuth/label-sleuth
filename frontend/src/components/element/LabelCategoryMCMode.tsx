import {
  Menu,
  Divider,
  Tooltip,
  Button,
  Stack,
  Box,
} from "@mui/material";
import { LabelTypesEnum, PanelIdsEnum } from "../../const";
import { useAppSelector } from "../../customHooks/useRedux";
import { Category, Element } from "../../global";
import useLabelState from "../../customHooks/useLabelState";
import { TooltipProps } from "../labelButtons/LabelButtons";
import React from "react";
import AddIcon from "@mui/icons-material/Add";
import labelButtonClasses from "../labelButtons/index.module.css";
import { CategoryBadge } from "../categoryBadge/CategoryBadge";
import { getCategoryColorFromId } from "../../utils/utils";

interface CategoryMenuItemProps {
  category: Category;
  userLabel: LabelTypesEnum;
  element: Element;
  panelId: PanelIdsEnum;
  handleClose: (e: React.UIEvent) => void;
}

const ITEM_HEIGHT = 40;

const CategoryMenuItem = ({
  category,
  element,
  panelId,
  handleClose,
}: CategoryMenuItemProps) => {
  const evaluationIsInProgress = useAppSelector(
    (state) =>
      state.workspace.panels.panels[PanelIdsEnum.EVALUATION].isInProgress
  );

  // don't update counter is an evaluation is in progress
  const { chageMultiClassLabel } = useLabelState(!evaluationIsInProgress);
  const categories = useAppSelector((state) => state.workspace.categories);

  return (
    <Box
      sx={{ height: ITEM_HEIGHT, ml: 2 }}
    >
      <CategoryBadge
        categoryName={category.category_name}
        selectable
        hideTooltip
        onClick={handleClose}
        color={
          getCategoryColorFromId(category.category_id, categories) || undefined
        }
        // eslint-disable-next-line
        selected={category.category_id == element.multiclassUserLabel}
        onSelect={() => {
          chageMultiClassLabel(element, panelId, category.category_id);
        }}
        onUnselect={() => {
          chageMultiClassLabel(element, panelId, null);
        }}
      />
    </Box>
  );
};

interface LabelCategoriesMenuProps {
  anchorEl: (EventTarget & globalThis.Element) | null;
  open: boolean;
  element: Element;
  setLabelMenuOpenAnchorEl: any;
  panelId: PanelIdsEnum;
}

export const LabelCategoriesMenu = ({
  anchorEl,
  open,
  element,
  setLabelMenuOpenAnchorEl,
  panelId,
}: LabelCategoriesMenuProps) => {
  const categories = useAppSelector((state) => state.workspace.categories);

  // copy the array categories because sort is inplace
  const categoriesSorted = [...categories].sort((a, b) =>
    a.category_name.localeCompare(b.category_name)
  );

  const handleClose = (e: React.UIEvent) => {
    e.stopPropagation();
    setLabelMenuOpenAnchorEl(null);
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
      PaperProps={{
        style: {
          maxHeight: ITEM_HEIGHT * 10,
          minWidth: "20ch",
        },
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Stack sx={{mt: 1}} >
        {categoriesSorted.map((category, i) => (
          <CategoryMenuItem
            key={i}
            category={category}
            userLabel={element.otherUserLabels[category.category_id]}
            element={element}
            panelId={panelId}
            handleClose={handleClose}
          />
        ))}
      </Stack>
    </Menu>
  );
};

interface LabelCategoriesMenuButtonProps {
  labelMenuOpen: boolean;
  setAnchorEl: any;
  tooltipProps?: TooltipProps;
}

export const LabelCategoriesMenuButton = ({
  setAnchorEl,
  labelMenuOpen,
  tooltipProps,
}: LabelCategoriesMenuButtonProps) => {
  const handleClick = (event: React.UIEvent) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  /**
   * this function is used to prevent the element component's handle click to be triggered
   * when the button is disabled
   */
  const handleClickHack = (event: React.UIEvent) => {
    event.stopPropagation();
  };

  return (
    <Tooltip
      {...{ title: "Label element", ...tooltipProps }}
      className={` ${!labelMenuOpen ? labelButtonClasses.visibility : ""}`}
      onClick={handleClickHack}
    >
      <Button
        aria-label="add category"
        onClick={handleClick}
        sx={{ textTransform: "none" }}
        variant="text"
        endIcon={<AddIcon />}
      >
        {"Label"}
      </Button>
    </Tooltip>
  );
};
