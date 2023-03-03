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
import { Dialog } from "@mui/material";
import { DialogTitle, DialogActions, DialogContent, DialogContentText } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { curCategoryNameSelector, deleteCategory } from "../../redux";
import { notify } from "../../../../utils/notification";
import { toast } from "react-toastify";
import { isFulfilled } from "@reduxjs/toolkit";

export default function DeleteCategoryModal({ open, setOpen }) {
  const curCategoryName = useSelector(curCategoryNameSelector);
  const dispatch = useDispatch();

  const handleClose = () => {
    setOpen(false);
  };

  const onSubmit = () => {
    setOpen(false);
    dispatch(deleteCategory()).then((action) => {
      if (isFulfilled(action)) {
        notify(`The category ${curCategoryName} has been deleted`, {
          type: toast.TYPE.SUCCESS,
          autoClose: 5000,
        });
      }
    });
  };

  return (
    <div>
      <Dialog open={open} onClose={handleClose} onKeyDown={(e) => e.stopPropagation()} autoFocus>
        <DialogTitle>{`Are you sure you want to delete the category '${curCategoryName}'?`}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action will permanently delete the category along with all the labels and models associated with it.
            The deletion cannot be reversed
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>No</Button>
          <Button onClick={onSubmit} autoFocus>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
