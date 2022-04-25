import React, { useEffect, useState } from 'react';
import classes from "./workspace-config.module.css"
import { useDispatch, useSelector } from 'react-redux'
import { getDatasets } from './workspaceConfigSlice'
import { useNavigate } from "react-router-dom";
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Box from '@mui/material/Box';
import ButtonLight from "../../components/buttons/ButtonLight"
import TextField from '@mui/material/TextField';
import { addDocuments } from './workspaceConfigSlice'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ComboBoxWithInputText from "../../components/combobox/ComboBoxWithInputText"

const ExistingWorkspace = () => {

    const notify = (message) => toast(message);
    const { datasets, loading } = useSelector((state) => state.workspaces)
    let navigate = useNavigate();
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(getDatasets())
    }, [dispatch])

    const [selectedValue, setSelectedValue] = useState('');

    const handleChange = (e) => {
        setSelectedValue(e.target.value);
    };
    
    const [selectedFile, setSelectedFile] = useState('');
    
    const handleFileChange = (e) =>{
      setSelectedFile(e.target.files[0])
    }

    const handleLoadDoc = () => {
        let dataset_name = datasets[selectedValue].dataset_id
        if(!dataset_name){
            return notify("Please fill out all the required fields!")
        }
        let formData = new FormData()
        formData.append(dataset_name, selectedFile)
        dispatch(addDocuments({ formData}))
        navigate('/login')
    }
    if (loading) return <p>Loading...</p>
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FormControl variant="standard" sx={{ m: 1, minWidth: 300, width: 300 }}>
                <FormLabel sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: "#f48c06", marginBottom: '20px' }}>Load new documents</FormLabel>
                <FormLabel sx={{ m: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontStyle: 'italic', fontSize: 12 }} className={classes["text-upload"]}> Upload a CSV file with "text" column and optionally a "document_id" column</FormLabel>

                <FormControl required variant="standard" sx={{ m: 1 }}>
                    <TextField
                        name="upload-file"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                    />
                </FormControl>
                <FormControl required variant="standard" sx={{ m: 1 }}>
                    <ComboBoxWithInputText options={datasets} label="Dataset" handleChange={handleChange}  /> 
                </FormControl>
                <FormControl variant="standard" sx={{ mt: 3, alignItems: 'center', justifyContent: 'center', marginTop: '45px' }}>
                    <ButtonLight onClick={handleLoadDoc} text="Upload" />
                </FormControl>
            </FormControl>
        </Box>
    );
};

export default ExistingWorkspace;