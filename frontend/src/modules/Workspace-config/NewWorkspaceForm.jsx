import React from 'react';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import ControlledSelect from "../../components/dropdown/Dropdown"
import Box from '@mui/material/Box';
import ButtonIBM from "../../components/buttons/ButtonIBM";
import 'react-toastify/dist/ReactToastify.css';
import classes from "./workspace-config.module.css";
import { NEW_WORKSPACE_NAME_PLACEHOLER_MSG, NEW_WORKSPACE_NAME_MSG } from '../../const';
const NewWorkspaceForm = ({ handleDatasetChange, selectedValue, handleChangeText, options, handleNewWorkspace }) => {

    return (
        <Box className={classes.wrapper} style={{borderBottom: 'solid 1px #8d8d8d'}}>
            <h2 style={{padding: '25px', margin: 0}}>Create New</h2>
            <FormControl variant="standard">
                <FormControl variant="standard" sx={{ minWidth: 300, ml: '25px', mr: '25px', mb: '25px'}}>
                    <TextField
                        onChange={handleChangeText}
                        required
                        id="standard-basic"
                        label={NEW_WORKSPACE_NAME_MSG}
                        variant="standard"
                        inputProps={{
                            style: {
                                background: '#fff',
                                padding: '9px',
                                "&::placeholder": {
                                    color: "#b5b5b5"
                                }
                            }
                        }}
                        InputLabelProps={{ 
                            shrink: true,
                            style: {
                                fontSize: '18px',
                                marginTop: '-8px'
                            }
                         }}
                        placeholder={NEW_WORKSPACE_NAME_PLACEHOLER_MSG}
                    />
                </FormControl>
                <FormControl required variant="standard" sx={{ minWidth: 300, ml: '25px', mr: '25px'}}>
                    <ControlledSelect
                        label="Select Dataset"
                        value={selectedValue}
                        options={options}
                        onChange={handleDatasetChange}
                        placeholder="Choose from List"
                    />
                </FormControl>
                <div style={{width: '100%', display: 'flex', justifyContent: 'right', marginTop: '20px'}}>
                    <ButtonIBM onClick={handleNewWorkspace} text="Create & Go" />
                </div>
            </FormControl>
        </Box>
    );
};

export default NewWorkspaceForm;