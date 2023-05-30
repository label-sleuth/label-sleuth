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

import * as React from "react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { useAppDispatch } from "../../../../customHooks/useRedux";
import { editCategory } from "../../redux";
import {
  CREATE_NEW_CATEGORY_PLACEHOLDER_MSG,
  WRONG_INPUT_NAME_LENGTH,
  KeyboardKeysEnum,
  CATEGORY_NAME_MAX_CHARS,
} from "../../../../const";
import classes from "./index.module.css";
import { useNotification } from "../../../../utils/notification";
import { isFulfilled } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 350,
  bgcolor: "background.paper",
  border: "none",
  boxShadow: 24,
  p: 4,
};

interface EditCategoryModalProps {
  open: boolean, setOpen: (newValue: boolean) => void
}

export const EditCategoryModal = ({ open, setOpen }: EditCategoryModalProps) => {
  const dispatch =  useAppDispatch();
  const { notify } = useNotification()

  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [categoryNameError, setCategoryNameError] = React.useState("");

  const onModalClose = () => {
    setOpen(false);
    setCategoryNameError("");
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    event.preventDefault();
    if (event.key === KeyboardKeysEnum.ENTER) {
      onSubmit();
    }
  };

  const onSubmit = () => {
    dispatch(
      editCategory({
        newCategoryName: newCategoryName.trim(),
        newCategoryDescription: "Category description",
      })
    ).then((action) => {
      setOpen(false);
      if (isFulfilled(action)) {
        notify("The category name has been successfully edited", {
          type: toast.TYPE.SUCCESS,
          autoClose: 5000,
        toastId: "category_edited_toast"
        });
      }
    });
  };

  const handleCategoryNameChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let text = e.target.value;
    if (text) {
      if (text.length > CATEGORY_NAME_MAX_CHARS) {
        setCategoryNameError(WRONG_INPUT_NAME_LENGTH(CATEGORY_NAME_MAX_CHARS));
      } else
        setCategoryNameError("");
    } else {
      setCategoryNameError("");
    }
    setNewCategoryName(text);
  };

  return (
    <div>
      <Modal
        open={open}
        onClose={onModalClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        disableRestoreFocus
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ marginBottom: 2 }}>
            {"Edit category"}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: 1,
              gridTemplateColumns: "60% 40%",
              alignItems: "center",
              width: "300px",
            }}
          >
            <TextField
              id="outlined-basic"
              className={classes.new_modal_name}
              label={CREATE_NEW_CATEGORY_PLACEHOLDER_MSG}
              onChange={handleCategoryNameChange}
              onKeyUp={onKeyDown}
              error={categoryNameError ? true : false}
              autoFocus
            />
            <Button
              onClick={onSubmit}
              className={categoryNameError || !newCategoryName ? classes["btn-disabled"] : classes.btn}
              sx={{ marginLeft: 3 }}
              disabled={categoryNameError !== "" || newCategoryName === ""}
            >
              Edit
            </Button>
            <p className={classes["error"]}>{categoryNameError}</p>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}
