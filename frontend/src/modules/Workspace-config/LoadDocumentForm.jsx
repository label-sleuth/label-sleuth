import classes from "./workspace-config.module.css"
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Box from '@mui/material/Box';
import ButtonIBM from "../../components/buttons/ButtonIBM"
import buttonIBMClasses from "../../components/buttons/Buttons.module.css"
import LoadingButtonIBM from '../../components/buttons/LoadingButtonIBM';
import TextField from '@mui/material/TextField';
import 'react-toastify/dist/ReactToastify.css';
import ComboBoxWithInputText from "../../components/combobox/ComboBoxWithInputText";
import data_icon from "../../assets/workspace-config/document--add.svg"
import { useSelector } from 'react-redux';
import { UPLOAD_NEW_DATASET_MSG, UPLOAD_NEW_DATASET_NAME_PLACEHOLER_MSG, UPLOAD_NEW_DATASET_FILE_HELPER_MSG } from '../../const';

const LoadDocumentForm = ({ handleLoadDoc, handleFileChange, datasets, handleInputChange, textFieldRef, comboInputTextRef, isToastActive }) => {
    const uploadingDataset = useSelector((state) => state.workspaces.uploadingDataset);

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
                        />
                    </FormControl>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'right', marginTop: '20px' }}>
                        {uploadingDataset ? <LoadingButtonIBM /> : <ButtonIBM onClick={handleLoadDoc} text="Upload" className={isToastActive ? buttonIBMClasses["button-ibm-disabled"] : buttonIBMClasses["button-ibm"]} />}
                    </div>
                </FormControl>
            </div>
        </Box>
    );
};

export default LoadDocumentForm;