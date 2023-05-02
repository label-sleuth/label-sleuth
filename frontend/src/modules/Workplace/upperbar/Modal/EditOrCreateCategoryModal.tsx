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
import TextField from "@mui/material/TextField";
import classes from "./index.module.css";
import {
  CREATE_NEW_CATEGORY_PLACEHOLDER_MSG,
  WRONG_INPUT_NAME_LENGTH,
  KeyboardKeysEnum,
  CATEGORY_NAME_MAX_CHARS,
} from "../../../../const";
import {
  DialogContentText,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import { ChangeEvent } from "react";

interface EditOrCreateCategoryModalProps {
  categoryName: string;
  setCategoryName: React.Dispatch<React.SetStateAction<string>>;
  categoryDescription: string;
  setCategoryDescription: React.Dispatch<React.SetStateAction<string>>;
  categoryNameError: string;
  setCategoryNameError: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: () => void;
  open: boolean;
  dialogTitle: string;
  helperText: string;
  onModalClose: () => void;
  submitButtonLabel: string;
}

export const EditOrCreateCategoryModal = ({
  categoryName,
  setCategoryName,
  categoryDescription,
  setCategoryDescription,
  categoryNameError,
  setCategoryNameError,
  open,
  dialogTitle,
  helperText,
  onModalClose,
  onSubmit,
  submitButtonLabel,
}: EditOrCreateCategoryModalProps) => {
  
  const handleCategoryNameFieldChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    e.preventDefault();
    let text = e.target.value;
    if (text) {
      if (text.length > CATEGORY_NAME_MAX_CHARS) {
        setCategoryNameError(WRONG_INPUT_NAME_LENGTH(CATEGORY_NAME_MAX_CHARS));
      } else setCategoryNameError("");
    } else {
      setCategoryNameError("");
    }
    setCategoryName(text);
  };

  const handleCategoryDescriptionFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    e.preventDefault();
    let text = e.target.value;
    setCategoryDescription(text.trim());
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
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ width: "300px" }}>
          {helperText}
        </DialogContentText>
        <Box
          component="form"
          sx={{
            "& .MuiTextField-root": { m: 1, width: "35ch" },
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            mt: 2,
          }}
          noValidate
          autoComplete="off"
        >
          <TextField
            id="outlined-basic"
            sx={{ marginLeft: "0 !important" }}
            label={CREATE_NEW_CATEGORY_PLACEHOLDER_MSG}
            onChange={handleCategoryNameFieldChange}
            error={categoryNameError ? true : false}
            autoFocus
            required
            value={categoryName}
          />

          <p className={classes["error"]}>{categoryNameError}</p>
          <TextField
            label="Category description"
            //placeholder=""
            sx={{
              marginLeft: "0 !important",
              "& .MuiFormHelperText-root": {
                ml: 0,
                mt: 1,
              },
            }}
            multiline
            rows={6}
            onChange={handleCategoryDescriptionFieldChange}
            helperText={"* indicates required field"}
            value={categoryDescription}
          />
          <Button
            onClick={onSubmit}
            className={
              categoryNameError || !categoryName
                ? classes["btn-disabled"]
                : classes.btn
            }
            disabled={categoryNameError !== "" || categoryName === ""}
            type="submit"
            sx={{ mt: 1 }}
            role="button"
          >
            {submitButtonLabel}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
