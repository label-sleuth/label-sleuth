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

import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import ControlledSelect from "../../components/Dropdown"
import FormLabel from '@mui/material/FormLabel';
import Box from '@mui/material/Box';
import ButtonLight from "../../components/buttons/ButtonLight"

const WorkspaceForm = ({ handleDatasetChange, selectedValue, handleChangeText, options, handleNewWorkspace, handleChange, handleClick, workspaces, value, options_workspace }) => {

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FormControl variant="standard" sx={{ m: 1, minWidth: 300 }}>
                <FormLabel sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: "#f48c06" }}>Create a new workspace</FormLabel>
                <FormControl variant="standard" sx={{ m: 1 }}>
                    <TextField onChange={handleChangeText} required id="standard-basic" label="Name" variant="standard" />
                </FormControl>
                <FormControl required variant="standard" sx={{ m: 1 }}>
                    <ControlledSelect
                        label="Select dataset"
                        value={selectedValue}
                        options={options}
                        onChange={handleDatasetChange}
                    />
                </FormControl>
                <FormControl variant="standard" sx={{ mt: 3, alignItems: 'center', justifyContent: 'center', height: '100px', marginTop: '100px' }}>
                    <ButtonLight onClick={handleNewWorkspace} text="Create" />
                </FormControl>
            </FormControl>
        </Box>
    );
};

export default WorkspaceForm;