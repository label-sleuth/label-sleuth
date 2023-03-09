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

interface DeleteWorkspaceModalProps {
  open: boolean, 
  setOpen: React.Dispatch<React.SetStateAction<boolean>>, 
  handleDeleteWorkspace: () => void, 
  value: string,
}

export const DeleteWorkspaceModal = ({ open, setOpen, handleDeleteWorkspace, value }: DeleteWorkspaceModalProps) => {
  const handleClose = () => {
    setOpen(false);
  };

  const onSubmit = () => {
    setOpen(false);
    handleDeleteWorkspace();
  };

  return (
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{`Are you sure you want to delete the workspace '${value}'?`}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action will permanently delete the workspace along with all the categories, labels, and models
            associated with it. The deletion cannot be reversed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>No</Button>
          <Button onClick={onSubmit} autoFocus>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
  );
}
