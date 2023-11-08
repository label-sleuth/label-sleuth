import { useState, useMemo } from "react";
import {
  Menu,
  MenuItem,
  Stack,
  MenuList,
  Divider,
  Tooltip,
  IconButton,
  Typography,
  Badge,
  styled,
  BadgeProps,
} from "@mui/material";
import { LabelTypesEnum, PanelIdsEnum } from "../../const";
import { useAppSelector } from "../../customHooks/useRedux";
import { Category, Element } from "../../global";
import useLabelState from "../../customHooks/useLabelState";
import {
  NegButton,
  PosButton,
  TooltipProps,
} from "../labelButtons/LabelButtons";
import classes from "./Element.module.css";
import React from "react";
import AddIcon from "@mui/icons-material/Add";
import labelButtonClasses from "../labelButtons/index.module.css";

interface CategoryMenuItemProps {
  category: Category;
  userLabel: LabelTypesEnum;
  element: Element;
  panelId: PanelIdsEnum;
}

const ITEM_HEIGHT = 40;

const CategoryMenuItem = ({
  element,
  category,
  userLabel,
  panelId,
}: CategoryMenuItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { handlePosLabelAction, handleNegLabelAction } = useLabelState();

  return (
    <MenuItem
      onMouseEnter={(e) => {
        setIsHovered(true);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
      sx={{ height: ITEM_HEIGHT }}
      disableRipple
    >
      <Typography
        className={`${
          userLabel === LabelTypesEnum.POS
            ? classes.pos_user_label
            : userLabel === LabelTypesEnum.NEG
            ? classes.neg_user_label
            : ""
        }`}
        sx={{ textOverflow: "ellipsis", flexGrow: 1 }}
      >
        {category.category_name}
      </Typography>
      <Stack
        direction="row"
        spacing={0}
        sx={{ justifyContent: "flex-end", minWidth: "80px" }}
      >
        <NegButton
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleNegLabelAction(element, panelId, category.category_id);
          }}
          userLabel={userLabel}
          show={isHovered}
          showContidionally={false}
        />
        <PosButton
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handlePosLabelAction(element, panelId, category.category_id);
          }}
          userLabel={userLabel}
          show={isHovered}
          showContidionally={false}
        />
      </Stack>
    </MenuItem>
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
  const curCategory = useAppSelector((state) => state.workspace.curCategory);

  // copy the array categories because sort is inplace
  const categoriesSorted = [...categories].sort((a, b) =>
    a.category_name.localeCompare(b.category_name)
  );

  const handleClose = (e: any) => {
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
          minWidth: "26ch",
        },
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <MenuList>
        <p className={classes["menu-title"]}>
          Assign text to another category:
        </p>
        <Divider sx={{ marginBottom: "10px" }} />
        {categoriesSorted.map((category, i) =>
          category.category_id !== curCategory ? (
            <CategoryMenuItem
              key={i}
              category={category}
              userLabel={element.otherUserLabels[category.category_id]}
              element={element}
              panelId={panelId}
            />
          ) : null
        )}
      </MenuList>
    </Menu>
  );
};

const StyledBadge = styled(Badge)<BadgeProps>(({ theme }) => ({
  "& .MuiBadge-badge": {
    //border: `2px solid ${theme.palette.background.paper}`,
    backgroundColor: "gray",
    color: "white",
    fontSize: ".6rem",
    height: "15px",
    minWidth: "15px",
    borderRadius: "15px",
    padding: "0 3px",
    top: 1,
    left: 1,
  },
}));

interface LabelCategoriesMenuButtonProps {
  labelMenuOpen: boolean;
  setAnchorEl: any;
  tooltipProps?: TooltipProps;
  element: Element;
}

export const LabelCategoriesMenuButton = ({
  setAnchorEl,
  labelMenuOpen,
  tooltipProps,
  element,
}: LabelCategoriesMenuButtonProps) => {
  const categories = useAppSelector((state) => state.workspace.categories);

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

  const numberOfOtherCategoriesLabeled = useMemo(
    () =>
      Object.values(element.otherUserLabels).filter(
        (value) => value !== LabelTypesEnum.NONE
      ).length,
    [element]
  );

  const tooltipTitle = useMemo(
    () =>
      `Label to another category ${
        numberOfOtherCategoriesLabeled > 0
          ? `(${numberOfOtherCategoriesLabeled} already labeled)`
          : ""
      }`,
    [numberOfOtherCategoriesLabeled]
  );

  return (
    <Tooltip
      {...{ title: tooltipTitle, ...tooltipProps }}
      className={`${
        categories.length === 1 ? classes["button-disabled-pointer"] : ""
      } ${!labelMenuOpen ? labelButtonClasses["visibility-none"] : ""}`}
      onClick={handleClickHack}
    >
      <span>
        <IconButton
          aria-label="add"
          onClick={handleClick}
          sx={{ marginLeft: 1 }}
          className={labelButtonClasses.label_button}
          disabled={categories.length === 1}
        >
          <StyledBadge
            badgeContent={numberOfOtherCategoriesLabeled}
            anchorOrigin={{ vertical: "top", horizontal: "left" }}
          >
            <AddIcon />
          </StyledBadge>
        </IconButton>
      </span>
    </Tooltip>
  );
};
