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
import { useDispatch } from "react-redux";
import { editCategory } from "../../DataSlice";
import {
  CREATE_NEW_CATEGORY_PLACEHOLDER_MSG,
  WRONG_INPUT_NAME_LENGTH,
  REGEX_LETTER_NUMBERS_UNDERSCORE_SPACES,
  WRONG_INPUT_NAME_BAD_CHARACTER,
} from "../../../../const";
import { fetchCategories } from "../../DataSlice";
import classes from "./index.module.css";
import { notify } from "../../../../utils/notification";

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

export default function EditCategoryModal({ open, setOpen }) {
  const dispatch = useDispatch();

  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [categoryNameError, setCategoryNameError] = React.useState("");

  const onModalClose = () => {
    setOpen(false);
    setCategoryNameError("");
  };

  const onKeyDown = (event) => {
    event.preventDefault();
    if (event.key === "Enter") {
      onSubmit();
    }
  };

  const onSubmit = () => {
    dispatch(
      editCategory({
        newCategoryName: newCategoryName.trim(),
        newCategoryDescription: "Category description",
      })
    )
      .then(() => {
        setOpen(false);
        notify("The category name has been successfully edited", {
          type: "success",
          autoClose: 5000,
        }); 
      });
  };

  const handleCategoryNameChange = (e) => {
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
      >
        <Box sx={style}>
          <Typography
            id="modal-modal-title"
            variant="h6"
            component="h2"
            sx={{ marginBottom: 2 }}
          >
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
              className={
                categoryNameError || !newCategoryName
                  ? classes["btn-disabled"]
                  : classes.btn
              }
              sx={{ marginLeft: 3 }}
              disabled={categoryNameError !== '' || newCategoryName === '' }
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
