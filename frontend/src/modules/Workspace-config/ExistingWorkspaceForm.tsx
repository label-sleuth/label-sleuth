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
import { Box, FormControl } from "@mui/material";
import ControlledSelect from "../../components/dropdown/Dropdown";
import ButtonIBM from "../../components/buttons/ButtonIBM";
import buttonIBMClasses from "../../components/buttons/Buttons.module.css";
import classes from "./workspace-config.module.css";
import { DeleteWorkspaceModal } from "./DeleteWorkspaceModal";

interface ExistingWorkspaceFormProps {
	handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	handleClick: () => void;
	handleDeleteWorkspace: () => void;
	value: string;
	options: { value: string; label: string }[];
	deleteButtonEnabled: (event: React.MouseEvent<HTMLButtonElement>) => void;
	style: string;
}
const ExistingWorkspaceForm = ({
  handleChange,
  handleClick,
  handleDeleteWorkspace,
  value,
  options,
  deleteButtonEnabled,
}: ExistingWorkspaceFormProps ) => {
  const [deleteWorkspaceModalOpen, setDeleteWorkspaceModalOpen] = React.useState(false);

  return (
    <Box className={classes.wrapper} style={{ borderBottom: "solid 1px #8d8d8d" }}>
      <DeleteWorkspaceModal
        open={deleteWorkspaceModalOpen}
        setOpen={setDeleteWorkspaceModalOpen}
        handleDeleteWorkspace={handleDeleteWorkspace}
        value={value}
      />
      <h2 style={{ padding: "25px", margin: 0 }}>Continue</h2>
      <FormControl variant="standard">
        <FormControl variant="standard" sx={{ minWidth: 300, ml: "25px", mr: "25px" }}>
          <ControlledSelect
            label="Continue with existing workspace"
            value={value}
            options={options}
            onChange={handleChange}
            placeholder="Choose from List"
            noOptionsPlaceholder="No workspaces available"
          />
        </FormControl>
        <div style={{ width: "100%", display: "flex", justifyContent: "right", marginTop: "20px" }}>
          <ButtonIBM
            disabled={!deleteButtonEnabled}
            style={{ marginRight: "1px" }}
            handleClick={() => setDeleteWorkspaceModalOpen(true)}
            className={buttonIBMClasses["button-ibm"]}
            text="Delete"
          />
          <ButtonIBM handleClick={handleClick} className={buttonIBMClasses["button-ibm"]} text="Go" />
        </div>
      </FormControl>
    </Box>
  );
};

export default ExistingWorkspaceForm;
