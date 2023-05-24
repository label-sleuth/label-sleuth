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
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useAppDispatch } from "../../../../customHooks/useRedux";
import { isFulfilled } from "@reduxjs/toolkit";
import { createCategoryOnServer } from "../../redux";
import TextField from "@mui/material/TextField";
import classes from "./index.module.css";
import {
  CREATE_NEW_CATEGORY_MODAL_MSG,
  CREATE_NEW_CATEGORY_PLACEHOLDER_MSG,
  WRONG_INPUT_NAME_LENGTH,
  KeyboardKeysEnum,
  CREATE_NEW_CATEGORY_HELPER_MSG,
  CATEGORY_NAME_MAX_CHARS,
} from "../../../../const";
import { DialogContentText, Dialog, DialogTitle, DialogContent } from "@mui/material";
import { useNotification } from "../../../../utils/notification";
import { toast } from "react-toastify";
import { ChangeEvent } from "react";

interface CreateCategoryModalProps {
  open: boolean;
  setOpen: (newValue: boolean) => void;
}

export const CreateCategoryModal = ({ open, setOpen }: CreateCategoryModalProps) => {
  const [text, setText] = React.useState("");
  const [categoryNameError, setCategoryNameError] = React.useState("");
  const dispatch = useAppDispatch();
  const { notify } = useNotification();

  const handleTextFieldChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.preventDefault();
    let text = e.target.value;
    if (text) {
      if (text.length > CATEGORY_NAME_MAX_CHARS) {
        setCategoryNameError(WRONG_INPUT_NAME_LENGTH);
      }  else
        setCategoryNameError("");
    } else {
      setCategoryNameError("");
    }
    setText(text.trim());
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === KeyboardKeysEnum.ENTER) {
      onSubmit();
    }
  };

  const onSubmit = async () => {
    const newCategoryName = text;

    dispatch(createCategoryOnServer({ categoryName: newCategoryName })).then((actionResult) => {
      if (isFulfilled(actionResult)) {
        onModalClose();
        notify(`The category '${newCategoryName}' has been created`, {
          type: toast.TYPE.SUCCESS,
          autoClose: 5000,
          toastId: 'category_created_toast'
        });
      }
    });
  };

  const onModalClose = () => {
    setOpen(false);
    setCategoryNameError("");
    setText("");
  };

  return (
    <Dialog
      open={open}
      onClose={onModalClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      disableRestoreFocus
      onKeyDown={(e) => e.stopPropagation()}
    >
      <DialogTitle id="modal-modal-title">{CREATE_NEW_CATEGORY_MODAL_MSG}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ width: "300px" }}>{CREATE_NEW_CATEGORY_HELPER_MSG}</DialogContentText>
        <Box
          sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: "60% 40%",
            alignItems: "center",
            width: "300px",
            marginTop: "20px",
          }}
        >
          <TextField
            id="outlined-basic"
            className={classes.new_modal_name}
            label={CREATE_NEW_CATEGORY_PLACEHOLDER_MSG}
            onChange={handleTextFieldChange}
            onKeyUp={onKeyDown}
            error={categoryNameError ? true : false}
            autoFocus
          />
          <Button
            onClick={onSubmit}
            className={categoryNameError || !text ? classes["btn-disabled"] : classes.btn}
            sx={{ marginLeft: 3 }}
            disabled={categoryNameError !== "" || text === ""}
          >
            Create
          </Button>
          <p className={classes["error"]}>{categoryNameError}</p>
        </Box>
      </DialogContent>

      {/* </Box> */}
    </Dialog>
  );
};
