import React from 'react';
import FormControl from '@mui/material/FormControl';
import ControlledSelect from "../../components/combobox/ControlledSelect"
import FormLabel from '@mui/material/FormLabel';
import Box from '@mui/material/Box';
import ButtonLight from "../../components/buttons/ButtonLight";
import 'react-toastify/dist/ReactToastify.css';

const ExistingWorkspaceForm = ({ handleChange, handleClick, workspaces, value, options }) => {

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FormControl variant="standard" sx={{ m: 1, minWidth: 300 }}>
                <FormLabel sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: "#f48c06", marginTop: '-10px' }}>Select an existing workspace</FormLabel>
                <FormControl required variant="standard" sx={{ m: 1, marginTop: '50px' }}>
                    <ControlledSelect
                        label="Select workspace"
                        value={value}
                        options={options}
                        onChange={handleChange}
                    />
                </FormControl>
                <FormControl variant="standard" sx={{ mt: 3, alignItems: 'center', justifyContent: 'center', height: '100px', marginTop: '100px' }}>
                    <ButtonLight onClick={handleClick} text="Go" />
                </FormControl>
            </FormControl>
        </Box>
    );
};

export default ExistingWorkspaceForm;