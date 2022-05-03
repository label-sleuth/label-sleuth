import React from 'react';
import classes from "./workspace-config.module.css"
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Box from '@mui/material/Box';
import ButtonLight from "../../components/buttons/ButtonLight"
import TextField from '@mui/material/TextField';
import 'react-toastify/dist/ReactToastify.css';
import ComboBoxWithInputText from "../../components/combobox/ComboBoxWithInputText"

const LoadDocumentForm = ({ handleLoadDoc, handleFileChange, datasets, handleInputChange }) => {

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FormControl variant="standard" sx={{ m: 1, minWidth: 300, width: 300 }}>
                <FormLabel sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: "#f48c06", marginBottom: '20px' }}>Load new documents</FormLabel>
                <FormLabel sx={{ m: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontStyle: 'italic', fontSize: 12 }} className={classes["text-upload"]}> Upload a CSV file with "text" column and optionally a "document_id" column</FormLabel>

                <FormControl encType="multipart/form-data" required variant="standard" sx={{ m: 1 }}>
                    <TextField
                        name="file-upload"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                    />
                </FormControl>
                <FormControl required variant="standard"  sx={{ m: 1,maxHeight: 143  }}>
                    <ComboBoxWithInputText options={datasets} label="Dataset" handleInputChange={handleInputChange} />
                </FormControl>
                <FormControl variant="standard" sx={{ mt: 3, alignItems: 'center', justifyContent: 'center', marginTop: '45px' }}>
                    <ButtonLight onClick={handleLoadDoc} text="Upload" />
                </FormControl>
            </FormControl>
        </Box>
    );
};

export default LoadDocumentForm;