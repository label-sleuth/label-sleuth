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
import ControlledSelect from "../../components/Dropdown"
import { addDocuments } from './workspaceConfigSlice'

const ExistingWorkspace = () => {

    const { datasets, loading } = useSelector((state) => state.workspaces)

    let navigate = useNavigate();
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(getDatasets())
    }, [dispatch])

    const handleClick = () => {
        // dispatch(addDocuments({   }))
        navigate('/')
    }
    const [selectedValue, setSelectedValue] = useState(''); // selected option
    const handleChange = (value) => {
        setSelectedValue(value);
    };

    if (loading) return <p>Loading...</p>
    const options = datasets.map((item) => ({ value: item.dataset_id, title: item.dataset_id }))

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FormControl variant="standard" sx={{ m: 1, minWidth: 300, width:300 }}>
                <FormLabel sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color:"#f48c06" }}>Load new documents</FormLabel>
                <FormLabel sx={{ m: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontStyle: 'italic', fontSize: 12 }} className={classes["text-upload"]}> Upload a CSV file with "text" column and optionally a "document_id" column</FormLabel>

                <FormControl required variant="standard" sx={{ m: 1 }}>
                    <TextField
                        name="upload-file"
                        type="file"
                    />
                </FormControl>
                <FormControl required variant="standard" sx={{ m: 1 }}>
                    <ControlledSelect
                        label="Select dataset"
                        value={selectedValue}
                        options={options}
                        onChange={handleChange}
                    />
                </FormControl>
                <FormControl variant="standard" sx={{ mt: 3, alignItems: 'center', justifyContent: 'center', marginTop: '55px' }}>
                    <ButtonLight onClick={handleClick} text="Upload" />
                </FormControl>
            </FormControl>
        </Box>
    );
};

export default ExistingWorkspace;