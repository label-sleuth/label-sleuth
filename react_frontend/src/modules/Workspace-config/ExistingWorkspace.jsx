import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux'
import { getWorkspaces } from './workspaceConfigSlice'
import { useNavigate } from "react-router-dom";
import FormControl from '@mui/material/FormControl';
import ControlledSelect from "../../components/Dropdown"
import FormLabel from '@mui/material/FormLabel';
import Box from '@mui/material/Box';
import ButtonLight from "../../components/buttons/ButtonLight";
import classes from "./workspace-config.module.css"

const ExistingWorkspace = () => {

    const { workspaces, loading } = useSelector((state) => state.workspaces)
    const workspace = useSelector((state) => state.workspace)

    let navigate = useNavigate();
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(getWorkspaces())
    }, [dispatch])

    useEffect(() => {
        dispatch(getWorkspaces())
    }, [dispatch])

    const [value, setValue] = useState(''); // selected option
    const handleChange = (value) => {
        setValue(value);
    };

    const handleClick = (e) => {
        navigate('/')
    };

    const options = workspaces.map((item) => ({ value: item, title: item }))
    if (loading) return <p>Loading...</p>

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FormControl variant="standard" sx={{ m: 1, minWidth: 300 }}>
                <FormLabel sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color:"#f48c06" }}>Select an existing workspace</FormLabel>
                <FormControl required variant="standard" sx={{ m: 1, marginTop:'50px' }}>
                    <ControlledSelect
                        label="Select workspace"
                        value={value}
                        options={options}
                        onChange={handleChange}
                    />
                </FormControl>
                <FormControl variant="standard" sx={{ mt: 3, alignItems: 'center', justifyContent: 'center',height: '100px',marginTop: '100px' }}>
                    <ButtonLight onClick={handleClick} text="Go" />
                </FormControl>
            </FormControl>
        </Box>
    );
};

export default ExistingWorkspace;