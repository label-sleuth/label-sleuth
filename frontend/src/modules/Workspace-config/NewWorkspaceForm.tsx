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
  WorkspaceMode,
} from "../../const";
import {
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
} from "@mui/material";
import info_icon from "../../assets/workspace/help.svg";

interface NewWorkspaceFormProps {
  handleDatasetChange: (value: string) => void;
  selectedValue: string;
  handleChangeText: (e: React.FormEvent) => void;
  options: DropdownOption[];
  handleNewWorkspace: () => void;
  textValue: string;
  newWorkspaceNameError: string;
  mode: WorkspaceMode;
  handleModeSelectionChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
}

const NewWorkspaceForm = ({
  handleDatasetChange,
  selectedValue,
  handleChangeText,
  options,
  handleNewWorkspace,
  textValue,
  newWorkspaceNameError,
  mode,
  handleModeSelectionChange,
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
          sx={{ minWidth: 300, ml: "25px", mr: "25px", mb: "25px" }}
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
        <FormControl
          variant={"standard"}
          sx={{ minWidth: 300, ml: "25px", mr: "25px" }}
        >
          <FormLabel
            id="demo-row-radio-buttons-group-label"
            sx={{
              fontSize: "14px",
              marginTop: "-8px",
              color: "#00000099",
            }}
          >
            Mode
          </FormLabel>
          <RadioGroup
            aria-labelledby="demo-row-radio-buttons-group-label"
            name="row-radio-buttons-group"
            onChange={handleModeSelectionChange}
            value={mode}
          >
            <Stack direction={"row"} alignItems="center">
              <FormControlLabel
                value={WorkspaceMode.BINARY}
                sx={{ color: "gray", mr: 1 }}
                control={
                  <Radio
                    size="small"
                    sx={{
                      "& .MuiSvgIcon-root": {
                        fontSize: 20,
                      },
                      pr: 0.5,
                    }}
                  />
                }
                label="Binary"
              />
              <Box
                component="img"
                src={info_icon}
                className={classes.moreinfo}
                sx={{ width: "14px", height: "14px" }}
              />
            </Stack>
            <Stack direction={"row"} alignItems="center">
              <FormControlLabel
                value={WorkspaceMode.MULTICLASS}
                sx={{ color: "gray", mr: 1 }}
                control={
                  <Radio
                    size="small"
                    sx={{
                      "& .MuiSvgIcon-root": {
                        fontSize: 20,
                      },
                      pr: 0.5,
                    }}
                  />
                }
                label="Multi class (beta)"
              />
              <Box
                component="img"
                src={info_icon}
                className={classes.moreinfo}
                sx={{ width: "14px", height: "14px" }}
              />
            </Stack>
            <Stack direction={"row"} alignItems="center">
              <FormControlLabel
                disabled
                value={WorkspaceMode.MULTILABEL}
                sx={{ color: "gray", mr: 1 }}
                control={
                  <Radio
                    size="small"
                    sx={{
                      "& .MuiSvgIcon-root": {
                        fontSize: 20,
                      },
                      pr: 0.5,
                    }}
                  />
                }
                label="Multi label (coming soon)"
              />
              <Box
                component="img"
                src={info_icon}
                className={classes.moreinfo}
                sx={{ width: "14px", height: "14px" }}
              />
            </Stack>
          </RadioGroup>
        </FormControl>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "right",
            marginTop: "10px",
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
