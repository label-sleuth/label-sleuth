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
import {
  ControlledSelect,
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
  Tooltip,
  Typography,
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

const BinaryModeText = () => {
  return (
    <Typography>
      {`Use this mode if the question you are asking is whether or not a given
      text belongs to one specific category, where the category represents a
      property exhibited by the text. For example, does the text mention privacy
      risk. In binary mode, `}
      <strong>
        {`you can build multiple independent classifiers each dealing with a
        different property`}
      </strong>
    </Typography>
  );
};

const MulticlassModeText = () => {
  return (
    <Typography>
      {`Use this mode if each text in your data belongs to exactly one category
      from a closed set of categories, each representing a single property
      exhibited by a given text. For example, for which department a certain
      customer support email should be directed to. In multi class mode, `}
      <strong>{` you
      build a single classifier for all the categories.`}</strong>
    </Typography>
  );
};

const MultilabelModeText = () => {
  return (
    <Typography>
      {`Use this mode if you have a set of categories you are interested in, and
      the question you are asking is which of these properties are exhibited by
      a given text. Each text belongs to zero or more categories . For example,
      does the text mention privacy risk, safety risk, financial risk etc. In
      multi label mode, `}
      <strong>
        {"you can build a single classifier for all the categories."}
      </strong>
    </Typography>
  );
};

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
          sx={{ minWidth: 350, ml: "25px", mr: "25px", mb: "25px" }}
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
              <Tooltip
                title={<BinaryModeText />}
                placement={"right"}
                componentsProps={{
                  tooltip: {
                    sx: {
                      bgcolor: "rgb(97 97 97)",
                    },
                  },
                }}
              >
                <Box
                  component="img"
                  src={info_icon}
                  className={classes.moreinfo}
                  sx={{ width: "14px", height: "14px" }}
                />
              </Tooltip>
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
              <Tooltip
                title={<MulticlassModeText />}
                placement={"right"}
                componentsProps={{
                  tooltip: {
                    sx: {
                      bgcolor: "rgb(97 97 97)",
                    },
                  },
                }}
              >
                <Box
                  component="img"
                  src={info_icon}
                  className={classes.moreinfo}
                  sx={{ width: "14px", height: "14px" }}
                />
              </Tooltip>
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
              <Tooltip
                title={<MultilabelModeText />}
                placement={"right"}
                componentsProps={{
                  tooltip: {
                    sx: {
                      bgcolor: "rgb(97 97 97)",
                    },
                  },
                }}
              >
                <Box
                  component="img"
                  src={info_icon}
                  className={classes.moreinfo}
                  sx={{ width: "14px", height: "14px" }}
                />
              </Tooltip>
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
