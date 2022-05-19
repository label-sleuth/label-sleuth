import React from 'react';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import ControlledSelect from "../../components/combobox/ControlledSelect"
import FormLabel from '@mui/material/FormLabel';
import Box from '@mui/material/Box';
import ButtonLight from "../../components/buttons/ButtonLight"
import 'react-toastify/dist/ReactToastify.css';

const NewWorkspaceForm = ({ handleDatasetChange, selectedValue, handleChangeText, options, handleNewWorkspace }) => {

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

export default NewWorkspaceForm;