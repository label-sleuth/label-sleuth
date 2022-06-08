import React from 'react';
import classes from "./workspace-config.module.css"
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Box from '@mui/material/Box';
import ButtonIBM from "../../components/buttons/ButtonIBM"
import LoadingButtonIBM from '../../components/buttons/LoadingButtonIBM';
import TextField from '@mui/material/TextField';
import 'react-toastify/dist/ReactToastify.css';
import ComboBoxWithInputText from "../../components/combobox/ComboBoxWithInputText";
import data_icon from "../../assets/workspace-config/document--add.svg"
import { useSelector } from 'react-redux';

const LoadDocumentForm = ({ handleLoadDoc, handleFileChange, datasets, handleInputChange, datasetName }) => {
    const uploadingDataset = useSelector((state) => state.workspaces.uploadingDataset);
    return (
        <Box className={classes.wrapper} style={{borderRight: 'none'}}>
            <div className={classes.sleuth_header}>
                <img alt="dataset" src={data_icon} style={{ width: '16px', height: '16px', marginRight: '6px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: '400', margin: 0, paddingTop: '2px'}}>New Documents</h4>
            </div>
            <div style={{borderRight: 'solid 1px #8d8d8d'}}>
                <h2 style={{padding: '25px', margin: 0}}>Upload</h2>
                <FormControl variant="standard" sx={{ m: 0, width: '350px' }}>
                    <FormLabel style={{
                        paddingLeft: '25px',
                        paddingRight: '25px',
                        fontSize: '13px',
                        marginBottom: '5px'
                    }}>Upload New File</FormLabel>
                    <FormControl 
                        encType="multipart/form-data" 
                        required
                        variant="standard"
                        style={{padding: '0 25px'}}>
                        <TextField
                            variant="standard"
                            name="file-upload"
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            InputProps={{
                                disableUnderline: true,
                                style: {
                                    border: 'dotted 1px #b5b5b5',
                                    padding: '12px',
                                    borderRadius: 0
                                }
                            }}
                        />
                    </FormControl>
                    <FormLabel sx={{margin: '5px 25px', fontStyle: 'italic', fontSize: 12 }} className={classes["text-upload"]}> Upload a CSV file with "text" column and optionally a "document_id" column</FormLabel>

                    
                    <FormControl required variant="standard"  style={{margin: '35px 25px 10px 25px'}}>
                        <ComboBoxWithInputText 
                            options={datasets}
                            label="As New Dataset / Add to Existing"
                            handleInputChange={handleInputChange}
                            placeholder="e.g. New_Upload_Name"
                            value={datasetName} />
                    </FormControl>
                    <div style={{width: '100%', display: 'flex', justifyContent: 'right', marginTop: '20px'}}>
                        { uploadingDataset ? <LoadingButtonIBM /> : <ButtonIBM onClick={handleLoadDoc} text="Upload" />}
                    </div>
                </FormControl>
            </div>
        </Box>
    );
};

export default LoadDocumentForm;