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

import React from "react";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import ControlledSelect, {
  DropdownOption,
} from "../../components/dropdown/Dropdown";
import Box from "@mui/material/Box";
import ButtonIBM from "../../components/buttons/ButtonIBM";
import buttonIBMClasses from "../../components/buttons/Buttons.module.css";
import classes from "./workspace-config.module.css";
import {
  NEW_WORKSPACE_NAME_PLACEHOLER_MSG,
  NEW_WORKSPACE_NAME_MSG,
} from "../../const";

interface NewWorkspaceFormProps {
  handleDatasetChange: (value: string) => void;
  selectedValue: string;
  handleChangeText: (e: React.FormEvent) => void;
  options: DropdownOption[];
  handleNewWorkspace: () => void;
  textValue: string;
  newWorkspaceNameError: string;
}

const NewWorkspaceForm = ({
  handleDatasetChange,
  selectedValue,
  handleChangeText,
  options,
  handleNewWorkspace,
  textValue,
  newWorkspaceNameError,
}: NewWorkspaceFormProps) => {
  return (
    <Box
      className={classes.wrapper}
      style={{ borderBottom: "solid 1px #8d8d8d" }}
    >
      <h2 style={{ padding: "25px", margin: 0 }}>Create New</h2>
      <FormControl variant="standard">
        <FormControl
          variant="standard"
          sx={{ minWidth: 300, ml: "25px", mr: "25px", mb: "25px" }}
        >
          <TextField
            onChange={handleChangeText}
            value={textValue}
            id="standard-basic"
            label={NEW_WORKSPACE_NAME_MSG}
            variant="standard"
            inputProps={{
              sx: {
                background: "#fff",
                padding: "9px",
                "&::placeholder": {
                  color: "#b5b5b5",
                },
              },
            }}
            InputLabelProps={{
              shrink: true,
              style: {
                fontSize: "18px",
                marginTop: "-8px",
              },
            }}
            placeholder={NEW_WORKSPACE_NAME_PLACEHOLER_MSG}
            error={newWorkspaceNameError ? true : false}
            helperText={newWorkspaceNameError}
          />
        </FormControl>
        <FormControl
          variant="standard"
          sx={{ minWidth: 300, ml: "25px", mr: "25px" }}
        >
          <ControlledSelect
            label="Select dataset"
            value={selectedValue}
            options={options}
            onChange={handleDatasetChange}
            placeholder="Choose from List"
            noOptionsPlaceholder="No datasets available"
          />
        </FormControl>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "right",
            marginTop: "20px",
          }}
        >
          <ButtonIBM
            handleClick={handleNewWorkspace}
            className={
              newWorkspaceNameError
                ? buttonIBMClasses["button-ibm-disabled"]
                : buttonIBMClasses["button-ibm"]
            }
            text="Create & Go"
          />
        </div>
      </FormControl>
    </Box>
  );
};

export default NewWorkspaceForm;
