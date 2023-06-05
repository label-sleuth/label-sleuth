/*
    Copyright (c) 2022 IBM Corp.
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

import React from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";

import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ModeEditOutlineOutlinedIcon from "@mui/icons-material/ModeEditOutlineOutlined";
import classes from "./UpperBar.module.css";
import Tooltip from "@mui/material/Tooltip";
import {
  CREATE_NEW_CATEGORY_TOOLTIP_MSG,
  DELETE_CATEGORY_TOOLTIP_MSG,
  EDIT_CATEGORY_TOOLTIP_MSG,
  APPBAR_HEIGHT,
  LEFT_DRAWER_WIDTH,
  ACTIONS_DRAWER_WIDTH,
} from "../../../const";
import { useAppSelector } from "../../../customHooks/useRedux";
import { CategoryCard } from "./CategoryCard";
import { IconButton } from "@mui/material";
import { useState } from "react";
import { CreateCategoryModal } from "./Modal/CreateCategoryModal";
import { DeleteCategoryModal } from "./Modal/DeleteCategoryModal";
import { EditCategoryModal } from "./Modal/EditCategoryModal";
import { CategoryFormControl } from "./CategoryFormControl";

// the AppBar component from mui isn't used because it's width doens't get updated when resizing the right sidebar
const AppBarLS = styled(Box)(
  ({ rightDrawerWidth, rightPanelOpen }: UpperBarProps) => ({
    position: "fixed",
    top: 0,
    left: LEFT_DRAWER_WIDTH,
    right: ACTIONS_DRAWER_WIDTH,
    height: APPBAR_HEIGHT,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#f4f4f4",
    borderBottom: "solid 1px #d6d6d6",
    padding: "0 25px",
    ...(rightPanelOpen && {
      marginRight: rightDrawerWidth,
    }),
  })
);

interface UpperBarProps {
  rightDrawerWidth: number;
  rightPanelOpen: boolean;
}

export const UpperBar = ({
  rightDrawerWidth,
  rightPanelOpen,
}: UpperBarProps) => {
  const curCategory = useAppSelector((state) => state.workspace.curCategory);
  const [createCategoryModalOpen, setCreateCategoryModalOpen] = useState(false);
  const [deleteCategoryModalOpen, setDeleteCategoryModalOpen] = useState(false);
  const [editCategoryModalOpen, setEditCategoryModalOpen] = useState(false);
  const [cardOpen, setCardOpen] = React.useState(true);

  const handleAddCategory = () => {
    setCreateCategoryModalOpen(true);
  };

  const handleDeleteCategory = () => {
    setDeleteCategoryModalOpen(true);
  };

  const handleEditCategory = () => {
    setEditCategoryModalOpen(true);
  };

  React.useEffect(() => {
    if (curCategory !== null && cardOpen) {
      setCardOpen(false);
    }
  }, [curCategory, cardOpen]);

  return (
    <AppBarLS
      rightDrawerWidth={rightDrawerWidth}
      rightPanelOpen={rightPanelOpen}
    >
      <Box className={classes["app-bar-container"]}>
        <Box className={classes["app-bar-container"]}>
          <p className={classes["dropdown-label"]}>Category: </p>
          <CategoryFormControl />
          <Tooltip title={CREATE_NEW_CATEGORY_TOOLTIP_MSG} disableFocusListener>
            <IconButton
              onClick={handleAddCategory}
              id="upperbar-add-category"
              className={classes["category-action-button"]}
            >
              <AddOutlinedIcon />
            </IconButton>
          </Tooltip>
          {curCategory !== null ? (
            <>
              <Tooltip title={DELETE_CATEGORY_TOOLTIP_MSG} disableFocusListener>
                <IconButton
                  className={classes["category-action-button"]}
                  onClick={handleDeleteCategory}
                >
                  <DeleteOutlineOutlinedIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={EDIT_CATEGORY_TOOLTIP_MSG} disableFocusListener>
                <IconButton
                  className={classes["category-action-button"]}
                  onClick={handleEditCategory}
                >
                  <ModeEditOutlineOutlinedIcon />
                </IconButton>
              </Tooltip>
            </>
          ) : null}
        </Box>

        {cardOpen ? <CategoryCard setCardOpen={setCardOpen} /> : null}
      </Box>
      <CreateCategoryModal
        open={createCategoryModalOpen}
        setOpen={setCreateCategoryModalOpen}
      />
      <DeleteCategoryModal
        open={deleteCategoryModalOpen}
        setOpen={setDeleteCategoryModalOpen}
      />
      <EditCategoryModal
        open={editCategoryModalOpen}
        setOpen={setEditCategoryModalOpen}
      />
    </AppBarLS>
  );
};
