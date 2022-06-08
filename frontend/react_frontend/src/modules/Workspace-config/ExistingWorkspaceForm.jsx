import React from 'react';
import FormControl from '@mui/material/FormControl';
import ControlledSelect from "../../components/dropdown/Dropdown"
import Box from '@mui/material/Box';
import ButtonIBM from "../../components/buttons/ButtonIBM";
import 'react-toastify/dist/ReactToastify.css';
import classes from "./workspace-config.module.css";

const ExistingWorkspaceForm = ({ handleChange, handleClick, workspaces, value, options }) => {

    return (
        <Box className={classes.wrapper} style={{borderBottom: 'solid 1px #8d8d8d'}}>
            <h2 style={{padding: '25px', margin: 0}}>Continue</h2>
            <FormControl variant="standard">
                <FormControl required variant="standard" sx={{ minWidth: 300, ml: '25px', mr: '25px'}}>
                    <ControlledSelect
                        label="Continue with Existing Workspace"
                        value={value}
                        options={options}
                        onChange={handleChange}
                        placeholder="Choose from List"
                    />
                </FormControl>
                <div style={{width: '100%', display: 'flex', justifyContent: 'right', marginTop: '20px'}}>
                    <ButtonIBM onClick={handleClick} text="Go" />
                </div>
            </FormControl>
        </Box>
    );
};

export default ExistingWorkspaceForm;