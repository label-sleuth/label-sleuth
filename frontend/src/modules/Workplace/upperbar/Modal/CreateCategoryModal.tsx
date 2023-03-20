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
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { useAppDispatch } from "../../../../customHooks/useRedux";
import { isFulfilled } from "@reduxjs/toolkit";
import { createCategoryOnServer } from "../../redux";
import TextField from "@mui/material/TextField";
import classes from "./index.module.css";
import {
  CREATE_NEW_CATEGORY_MODAL_MSG,
  CREATE_NEW_CATEGORY_PLACEHOLDER_MSG,
  WRONG_INPUT_NAME_LENGTH,
  WRONG_INPUT_NAME_BAD_CHARACTER,
  REGEX_LETTER_NUMBERS_UNDERSCORE_SPACES,
  KeyboardKeysEnum,
} from "../../../../const";
import { useNotification } from "../../../../utils/notification";
import { toast } from "react-toastify";
import { ChangeEvent } from "react";

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

interface CreateCategoryModalProps {
  open: boolean, setOpen: (newValue: boolean) => void
}

export const CreateCategoryModal = ({ open, setOpen }: CreateCategoryModalProps) => {
  const [text, setText] = React.useState("");
  const [categoryNameError, setCategoryNameError] = React.useState("");
  const dispatch = useAppDispatch();
  const { notify } = useNotification()

  const handleTextFieldChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.preventDefault();
    let text = e.target.value;
    if (text) {
      if (text.length > 30) {
        setCategoryNameError(WRONG_INPUT_NAME_LENGTH);
      } else if (!text.match(REGEX_LETTER_NUMBERS_UNDERSCORE_SPACES)) {
        setCategoryNameError(WRONG_INPUT_NAME_BAD_CHARACTER);
      } else setCategoryNameError("");
    } else {
      setCategoryNameError("");
    }
    setText(text);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    event.preventDefault();
    if (event.key === KeyboardKeysEnum.ENTER) {
      onSubmit();
    }
  };

  const onSubmit = async () => {
    const newCategoryName = text.trim();

    dispatch(createCategoryOnServer({ categoryName: newCategoryName }))
      .then((actionResult) => {
        if (isFulfilled(actionResult)) {
          setOpen(false);
          notify(`The category '${newCategoryName}' has been created`, {
            type: toast.TYPE.SUCCESS,
            autoClose: 5000,
          });
        }
      });
  };

  const onModalClose = () => {
    setOpen(false);
    setCategoryNameError("");
  };

  return (
    <div>
      <Modal
        open={open}
        onClose={onModalClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        disableRestoreFocus
        onKeyDown={e => e.stopPropagation()}
      >
        <Box sx={style}>
          <Typography
            id="modal-modal-title"
            variant="h6"
            component="h2"
            sx={{ marginBottom: 2 }}
          >
            {CREATE_NEW_CATEGORY_MODAL_MSG}
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
              onChange={handleTextFieldChange}
              onKeyUp={onKeyDown}
              error={categoryNameError ? true : false}
              autoFocus
            />
            <Button
              onClick={onSubmit}
              className={
                categoryNameError || !text
                  ? classes["btn-disabled"]
                  : classes.btn
              }
              sx={{ marginLeft: 3 }}
              disabled={categoryNameError !== "" || text === ""}
            >
              Create
            </Button>
            <p className={classes["error"]}>{categoryNameError}</p>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}
