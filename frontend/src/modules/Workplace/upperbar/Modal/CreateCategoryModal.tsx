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
import { createCategory } from "../../redux";
import { CREATE_NEW_CATEGORY_MODAL_MSG } from "../../../../const";
import { useNotification } from "../../../../utils/notification";
import { toast } from "react-toastify";
import { EditOrCreateCategoryModal } from "./EditOrCreateCategoryModal";
import { BadgeColor } from "../../../../global";
import { badgePalettes } from "../../../../utils/utils";

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
  const [categoryColor, setCategoryColor] = React.useState<
    BadgeColor | undefined
  >({ name: "green", palette: badgePalettes["green"] });
  const [categoryNameError, setCategoryNameError] = React.useState("");
  const dispatch = useAppDispatch();
  const { notify } = useNotification();

  const onModalClose = () => {
    setOpen(false);
    setCategoryNameError("");
    setCategoryName("");
    setCategoryDescription("");
  };

  const onSubmit = async () => {
    dispatch(
      createCategory({
        categoryName: categoryName.trim(),
        categoryDescription: categoryDescription.trim(),
        categoryColor,
      })
    ).then((actionResult) => {
      if (isFulfilled(actionResult)) {
        onModalClose();
        notify(`The category '${categoryName.trim()}' has been created`, {
          type: toast.TYPE.SUCCESS,
          autoClose: 5000,
          toastId: "category_created_toast",
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
      categoryColor={categoryColor}
      setCategoryColor={setCategoryColor}
      categoryNameError={categoryNameError}
      setCategoryNameError={setCategoryNameError}
      open={open}
      dialogTitle={CREATE_NEW_CATEGORY_MODAL_MSG}
      onSubmit={onSubmit}
      onModalClose={onModalClose}
      submitButtonLabel={"Create"}
    />
  );
};
