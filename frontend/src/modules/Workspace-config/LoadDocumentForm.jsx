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

import classes from "./workspace-config.module.css"
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Box from '@mui/material/Box';
import ButtonIBM from "../../components/buttons/ButtonIBM"
import buttonIBMClasses from "../../components/buttons/Buttons.module.css"
import TextField from '@mui/material/TextField';
import ComboBoxWithInputText from "../../components/combobox/ComboBoxWithInputText";
import data_icon from "../../assets/workspace-config/document--add.svg"
import { UPLOAD_NEW_DATASET_MSG, UPLOAD_NEW_DATASET_NAME_PLACEHOLER_MSG, UPLOAD_NEW_DATASET_FILE_HELPER_MSG } from '../../const';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

const LoadDocumentForm = ({ handleLoadDoc, handleFileChange, datasets, handleInputChange, textFieldRef, comboInputTextRef, backdropOpen, datasetNameError }) => {

    return (
        <Box className={classes.wrapper} style={{ borderRight: 'none' }}>
            <div className={classes.sleuth_header}>
                <img alt="dataset" src={data_icon} style={{ width: '16px', height: '16px', marginRight: '6px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: '400', margin: 0, paddingTop: '2px' }}>New Documents</h4>
            </div>
            <div style={{ borderRight: 'solid 1px #8d8d8d' }}>
                <h2 style={{ padding: '25px', margin: 0 }}>Upload</h2>
                <FormControl variant="standard" sx={{ m: 0, width: '350px' }}>
                    <FormLabel style={{
                        paddingLeft: '25px',
                        paddingRight: '25px',
                        fontSize: '13px',
                        marginBottom: '5px'
                    }}>{UPLOAD_NEW_DATASET_MSG}</FormLabel>
                    <FormControl
                        encType="multipart/form-data"
                        required
                        variant="standard"
                        style={{ padding: '0 25px' }}>
                        <TextField
                            inputRef={textFieldRef}
                            variant="standard"
                            name="file-upload"
                            type="file"
                            onChange={handleFileChange}
                            inputProps={{
                                accept: ".csv",
                                disableunderline: "true",
                                style: {
                                    border: 'dotted 1px #b5b5b5',
                                    padding: '12px',
                                    borderRadius: 0
                                }
                            }}
                        />
                    </FormControl>
                    <FormLabel sx={{ margin: '5px 25px', fontStyle: 'italic', fontSize: 12 }} className={classes["text-upload"]}>{UPLOAD_NEW_DATASET_FILE_HELPER_MSG}</FormLabel>
                    <FormControl required variant="standard" style={{ margin: '35px 25px 10px 25px' }}>
                        <ComboBoxWithInputText
                            ref={comboInputTextRef}
                            options={datasets}
                            label="As new dataset / Add to existing dataset"
                            handleInputChange={handleInputChange}
                            placeholder={UPLOAD_NEW_DATASET_NAME_PLACEHOLER_MSG}
                            error={datasetNameError} 
                            helperText={datasetNameError}
                        />
                    </FormControl>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'right', marginTop: '20px' }}>
                       <ButtonIBM onClick={handleLoadDoc} text="Upload" className={ buttonIBMClasses[`button-ibm${datasetNameError ? '-disabled' : ''}`]} />
                    </div>
                </FormControl>
            </div>
            <Backdrop
        sx={{ color: '#fff' }}
        open={backdropOpen}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
        </Box>

    );
};

export default LoadDocumentForm;