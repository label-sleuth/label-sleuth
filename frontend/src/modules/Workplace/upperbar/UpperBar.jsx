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
import useScrollTrigger from "@mui/material/useScrollTrigger";
import { useDispatch, useSelector } from "react-redux";
import { updateCurCategory } from "../redux";
import FormControl from "@mui/material/FormControl";
import ControlledSelect from "../../../components/dropdown/Dropdown";
import Tooltip from "@mui/material/Tooltip";
import {
  CREATE_NEW_CATEGORY_TOOLTIP_MSG,
  DELETE_CATEGORY_TOOLTIP_MSG,
  EDIT_CATEGORY_TOOLTIP_MSG,
  RIGHT_DRAWER_INITIAL_WIDTH,
  APPBAR_HEIGHT,
  LEFT_DRAWER_WIDTH,
} from "../../../const";
import { CategoryCard } from "./CategoryCard";
import { IconButton, Typography } from "@mui/material";
import { useState } from "react";
import CreateCategoryModal from "./Modal/CreateCategoryModal";
import DeleteCategoryModal from "./Modal/DeleteCategoryModal";
import EditCategoryModal from "./Modal/EditCategoryModal";
import { toast } from "react-toastify";
import { useLocalStorage } from "usehooks-ts";
import { Keyboard } from "../../../components/Keyboard"

function ElevationScroll(props) {
  const { children, window } = props;
  // Note that you normally won't need to set the window ref as useScrollTrigger
  // will default to window.
  // This is only being set here because the demo is in an iframe.
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
    target: window ? window() : undefined,
  });

  return React.cloneElement(children, {
    elevation: trigger ? 4 : 0,
  });
}

const AppBar = styled(Box, { shouldForwardProp: (prop) => prop !== "open" })(
  ({ theme, open }) => ({
    position: "fixed",
    top: 0,
    left: LEFT_DRAWER_WIDTH,
    right: 0,
    height: APPBAR_HEIGHT,
    transition: theme.transitions.create(["padding", "width"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
      transition: theme.transitions.create(["padding", "width"], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      paddingRight: RIGHT_DRAWER_INITIAL_WIDTH,
    }),
    // width: `calc(100vw - ${leftDrawerWidthh + 48}px)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  })
);

function CategoryFormControl() {
  const curCategory = useSelector((state) => state.workspace.curCategory);
  const categories = useSelector((state) => state.workspace.categories);
  const dispatch = useDispatch();
  const [showShortcutsNotification, setShowShortcutsNotification] = useLocalStorage('showShortcutsNotification', true)

  const options = categories
    .map((item) => ({ value: item.category_id, label: item.category_name }))
    .sort((a, b) => a.label.localeCompare(b.label));
  

  const ShortcutsMessageComponent = () => (
    <Typography>
      Press <Keyboard kbd={"Shift"}/>{" "}+{" "}<Keyboard kbd={"?"}/> to see the available keyboard shortcuts
    </Typography>
  )

  React.useEffect(() => {
    if (curCategory !== null && showShortcutsNotification === true) {
      notify(<ShortcutsMessageComponent />, "info-shortcuts", toast.TYPE.INFO)
      setShowShortcutsNotification(false)
    }
  }, [curCategory, showShortcutsNotification, setShowShortcutsNotification])
  
  const handleCategorySelect = (value) => {
    dispatch(updateCurCategory(value));
  };

  const notify = (message, toastId, type, autoClose = false) => {
    toast(message, {
      autoClose: autoClose,
      type: type || toast.TYPE.SUCCESS,
      toastId: toastId,
    });
  }

  return (
    <FormControl
      variant="standard"
      sx={{ minWidth: "200px", marginBottom: "16px" }}
    >
      <ControlledSelect
        id="label-select"
        value={curCategory}
        onChange={handleCategorySelect}
        options={options}
        placholder="placeholder"
        aria="category-select"
      />
    </FormControl>
  );
}

const UpperBar = () => {
  const curCategory = useSelector((state) => state.workspace.curCategory);
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
    <ElevationScroll>
      <AppBar
        className={classes.elevation_scroll}
        open={createCategoryModalOpen}
      >
        <div className={classes.upper}>
          <p>Category: </p>
          <CategoryFormControl placholder="placeholder" />

          <Tooltip title={CREATE_NEW_CATEGORY_TOOLTIP_MSG} disableFocusListener>
            <IconButton
              onClick={handleAddCategory}
              alt="Create new category"
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
                  alt="Delete category"
                  onClick={handleDeleteCategory}
                >
                  <DeleteOutlineOutlinedIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={EDIT_CATEGORY_TOOLTIP_MSG} disableFocusListener>
                <IconButton
                  className={classes["category-action-button"]}
                  alt="Edit category"
                  onClick={handleEditCategory}
                >
                  <ModeEditOutlineOutlinedIcon />
                </IconButton>
              </Tooltip>
            </>
          ) : null}
          {cardOpen ? <CategoryCard setCardOpen={setCardOpen} /> : null}
        </div>
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
      </AppBar>
    </ElevationScroll>
  );
};

export default UpperBar;