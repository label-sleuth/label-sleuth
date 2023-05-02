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
import { useAppDispatch } from "../../../../customHooks/useRedux";
import { isFulfilled } from "@reduxjs/toolkit";
import { createCategoryOnServer } from "../../redux";
import {
  CATEGORY_NAME_MAX_CHARS,
  CREATE_NEW_CATEGORY_HELPER_MSG,
  CREATE_NEW_CATEGORY_MODAL_MSG,
  KeyboardKeysEnum,
  WRONG_INPUT_NAME_LENGTH,
} from "../../../../const";
import { useNotification } from "../../../../utils/notification";
import { toast } from "react-toastify";
import { EditOrCreateCategoryModal } from "./EditOrCreateCategoryModal";

interface CreateCategoryModalProps {
  open: boolean;
  setOpen: (newValue: boolean) => void;
}

export const CreateCategoryModal = ({
  open,
  setOpen,
}: CreateCategoryModalProps) => {
  const [categoryName, setCategoryName] = React.useState("");
  const [categoryDescription, setCategoryDescription] = React.useState("");
  const [categoryNameError, setCategoryNameError] = React.useState("");
  const dispatch = useAppDispatch();
  const { notify } = useNotification();

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.preventDefault();
    let text = e.target.value;
    if (text) {
      if (text.length > CATEGORY_NAME_MAX_CHARS) {
        setCategoryNameError(WRONG_INPUT_NAME_LENGTH(CATEGORY_NAME_MAX_CHARS));
      }  else
        setCategoryNameError("");
    } else {
      setCategoryNameError("");
    }
    setCategoryName(text.trim());
  };

  const onModalClose = () => {
    setOpen(false);
    setCategoryNameError("");
    setCategoryName("");
    setCategoryDescription("");
  };

  const onSubmit = async () => {
    dispatch(
      createCategoryOnServer({ categoryName, categoryDescription })
    ).then((actionResult) => {
      if (isFulfilled(actionResult)) {
        onModalClose();
        notify(`The category '${categoryName}' has been created`, {
          type: toast.TYPE.SUCCESS,
          autoClose: 5000,
          toastId: 'category_created_toast'
        });
      }
    });
  };

  return (
    <EditOrCreateCategoryModal
      categoryName={categoryName}
      setCategoryName={setCategoryName}
      categoryDescription={categoryDescription}
      setCategoryDescription={setCategoryDescription}
      categoryNameError={categoryNameError}
      setCategoryNameError={setCategoryNameError}
      open={open}
      dialogTitle={CREATE_NEW_CATEGORY_MODAL_MSG}
      helperText={CREATE_NEW_CATEGORY_HELPER_MSG}
      onSubmit={onSubmit}
      onModalClose={onModalClose}
      submitButtonLabel={'Create'}
    />
  );
};
