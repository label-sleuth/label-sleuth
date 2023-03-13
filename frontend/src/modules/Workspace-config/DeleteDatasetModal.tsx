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
import { Box, Checkbox, Dialog, List, ListItem, Stack } from "@mui/material";
import { DialogTitle, DialogActions, DialogContent, DialogContentText } from "@mui/material";
import { useAppDispatch } from "../../customHooks/useRedux";
import { getWorkspacesByDatasetName } from "./workspaceConfigSlice";
import { isFulfilled } from "@reduxjs/toolkit";
import ErrorIcon from "@mui/icons-material/Error";

interface DeleteDatasetModalProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleDeleteDataset: () => void;
  value: string;
  clearFields: () => void;
}

export const DeleteDatasetModal = ({
  open,
  setOpen,
  handleDeleteDataset,
  value,
  clearFields,
}: DeleteDatasetModalProps) => {
  const dispatch = useAppDispatch();

  const [workspacesUsingDataset, setWorkspacesUsingDataset] = React.useState<string[] | null>(null);
  const [checkboxChecked, setCheckboxChecked] = React.useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCheckboxChecked(event.target.checked);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const onSubmit = () => {
    setOpen(false);
    handleDeleteDataset();
    clearFields();
  };


  React.useEffect(() => {
    if (!open) {
    }
  }, [open])

  React.useEffect(() => {
    if (open) {
      // resets the workspaces using the dataset when the modal gets closed
      // this preven the YES button from being enabled in case getting the workspaces fails
      // and thus the user can't click YES
      dispatch(getWorkspacesByDatasetName(value)).then((action: any) => {
        if (isFulfilled(action)) {
          setWorkspacesUsingDataset(action.payload["used_by"] as string[]);
        }
      });
    }
  }, [dispatch, value, open]);

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>{`Are you sure you want to delete the dataset '${value}'?`}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This action will permanently delete the dataset. The deletion cannot be reversed.
        </DialogContentText>
        {workspacesUsingDataset !== null && workspacesUsingDataset.length > 0 ? (
          <Box sx={{ marginTop: 4 }}>
            <Stack direction="row">
              <ErrorIcon
                sx={(theme) => ({
                  color: theme.palette.error.main,
                  pr: 1,
                  pl: 1,
                })}
              />
              <DialogContentText>The following workspaces use this dataset and will be deleted too:</DialogContentText>
            </Stack>
            <List
              sx={{
                listStyleType: "circle",
                "& .MuiListItem-root": {
                  display: "list-item",
                },
                pl: 6,
                pb: 2,
              }}
            >
              {workspacesUsingDataset !== null &&
                workspacesUsingDataset.map((workspace, i) => (
                  <ListItem sx={{ pb: 0, pt: 0 }}>
                    <DialogContentText>{workspace}</DialogContentText>
                  </ListItem>
                ))}
            </List>
            <Stack direction="row" sx={{ alignItems: "center" }}>
              <Checkbox checked={checkboxChecked} onChange={handleChange} inputProps={{ "aria-label": "controlled" }} />
              <DialogContentText>
                I understand that the listed workspaces are going to be deleted along with all the categories, labels,
                and models associated with them.
              </DialogContentText>
            </Stack>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>No</Button>
        <Button
          onClick={onSubmit}
          autoFocus
          disabled={workspacesUsingDataset === null || (workspacesUsingDataset.length > 0 && !checkboxChecked)}
        >
          Yes
        </Button>
      </DialogActions>
    </Dialog>
  );
};
