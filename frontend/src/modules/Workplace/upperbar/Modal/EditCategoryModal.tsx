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
import {
  useAppDispatch,
  useAppSelector,
} from "../../../../customHooks/useRedux";
import {
  curCategoryDescriptionSelector,
  curCategoryNameSelector,
  editCategory,
} from "../../redux";
import { useNotification } from "../../../../utils/notification";
import { isFulfilled } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { EditOrCreateCategoryModal } from "./EditOrCreateCategoryModal";
import { BadgeColor } from "../../../../global";

interface EditCategoryModalProps {
  open: boolean;
  setOpen: (newValue: boolean) => void;
}

export const EditCategoryModal = ({
  open,
  setOpen,
}: EditCategoryModalProps) => {
  
  const dispatch = useAppDispatch();
  const initialCategoryName = useAppSelector(curCategoryNameSelector) || "";
  const initialCategoryDescription =
    useAppSelector(curCategoryDescriptionSelector) || "";

  const { notify } = useNotification();

  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [categoryDescription, setCategoryDescription] = React.useState("");
  const [categoryColor, setCategoryColor] = React.useState<BadgeColor | undefined>(undefined);

  React.useEffect(() => {
    setNewCategoryName(initialCategoryName);
  }, [initialCategoryName]);

  React.useEffect(() => {
    setCategoryDescription(initialCategoryDescription);
  }, [initialCategoryDescription]);

  const [categoryNameError, setCategoryNameError] = React.useState("");

  const onModalClose = () => {
    setOpen(false);
    setCategoryNameError("");
  };

  const onSubmit = () => {
    dispatch(
      editCategory({
        newCategoryName: newCategoryName.trim(),
        newCategoryDescription: categoryDescription.trim(),
      })
    ).then((action) => {
      setOpen(false);
      if (isFulfilled(action)) {
        notify(`The category '${newCategoryName.trim()}' has been successfully edited`, {
          type: toast.TYPE.SUCCESS,
          autoClose: 5000,
        toastId: "category_edited_toast"
        });
      }
    });
  };

  return (
    <EditOrCreateCategoryModal
      categoryName={newCategoryName}
      setCategoryName={setNewCategoryName}
      categoryDescription={categoryDescription}
      setCategoryDescription={setCategoryDescription}
      categoryColor={categoryColor}
      setCategoryColor={setCategoryColor}
      categoryNameError={categoryNameError}
      setCategoryNameError={setCategoryNameError}
      open={open}
      dialogTitle={"Edit category"}
      onSubmit={onSubmit}
      onModalClose={onModalClose}
      submitButtonLabel={"Edit"}
    />
  );
};
