import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux'
import { createWorkspace, getDatasets } from './workspaceConfigSlice'
import { useNavigate } from "react-router-dom";
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import ControlledSelect from "../../components/Dropdown"
import FormLabel from '@mui/material/FormLabel';
import Box from '@mui/material/Box';
import ButtonLight from "../../components/buttons/ButtonLight"
import {  toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ExistingWorkspace = () => {
    const notify = (message) => toast(message);
    const { datasets, loading } = useSelector((state) => state.workspaces)

    let navigate = useNavigate();
    const dispatch = useDispatch()

    useEffect(() => {
        // if (loading) return <p>Loading...</p>
        dispatch(getDatasets())
    }, [dispatch])

    const [selectedValue, setSelectedValue] = useState('');
    const handleChange = (value) => {
        setSelectedValue(value);
    };
    const [textValue, setTextValue] = useState('');
    const handleChangeText = (e) => {
        setTextValue(e.target.value);
    };

    const isEnabled = selectedValue && textValue;

    const handleClick = () => {
        if(!selectedValue || !textValue){
            return notify("Please fill out all the required fields!")
        }
        dispatch(createWorkspace({ workspace_id: textValue, dataset_id: selectedValue }))
        navigate('/')
    }

    const options = datasets.map((item) => ({ value: item.dataset_id, title: item.dataset_id }))

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FormControl variant="standard" sx={{ m: 1, minWidth: 300 }}>
                <FormLabel sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: "#f48c06"  }}>Create a new workspace</FormLabel>
                <FormControl variant="standard" sx={{ m: 1 }}>
                    <TextField onChange={handleChangeText} required id="standard-basic" label="Name" variant="standard" />
                </FormControl>
                <FormControl required variant="standard" sx={{ m: 1 }}>
                    <ControlledSelect
                        label="Select dataset"
                        value={selectedValue}
                        options={options}
                        onChange={handleChange}
                    />
                </FormControl>
                <FormControl variant="standard" sx={{ mt: 3, alignItems: 'center', justifyContent: 'center', height: '100px', marginTop: '100px' }}>
                    <ButtonLight onClick={handleClick} text="Create" />
                </FormControl>
            </FormControl>
        </Box>
    );
};

export default ExistingWorkspace;