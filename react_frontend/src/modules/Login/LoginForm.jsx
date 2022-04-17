import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from "react-router-dom";
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Box from '@mui/material/Box';
import ButtonLight from "../../components/buttons/ButtonLight"
import { getAuthenticated, clearState } from './LoginSlice';

const LoginForm = () => {

    let navigate = useNavigate();
    const dispatch = useDispatch()
    const { token, errorMessage } = useSelector((state) => state.authenticate)

    useEffect(() => {
        if (token) {
            navigate('/workspaces')
        }
        
    }, [ navigate, token ])

    useEffect(() => {
        if (errorMessage) {
            dispatch(clearState())
        }
        
    }, [ dispatch, errorMessage])

    const [username, setUserName] = useState(''); 
    const handleUserName = (e) => {
        setUserName(e.target.value);
    };
    const [password, setPassword] = useState(''); 
    const handlePassword = (e) => {
        setPassword(e.target.value);
    };

    const handleClick = () => {
        dispatch(getAuthenticated({ username: username, password: password }))
    }

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '5px',
            width: 350,
            height: 350,
            backgroundColor: 'rgb(232, 240, 254)',
        }}>
            <FormControl variant="standard" sx={{ m: 1, minWidth: 250 }}>
                <FormLabel sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Login</FormLabel>
                <FormControl variant="standard" sx={{ m: 1 }}>
                    <TextField required onChange={handleUserName} id="standard-basic" label="Username" variant="standard" />
                </FormControl>
                <FormControl variant="standard" sx={{ m: 1 }}>
                    <TextField required onChange={handlePassword} id="standard-basic" label="Password" variant="standard" />
                </FormControl>
                {errorMessage &&
                    <FormLabel sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'red' }}>Login failed!</FormLabel>
                }
                <FormControl variant="standard" sx={{ mt: 3, alignItems: 'center', justifyContent: 'center' }}>
                    <ButtonLight onClick={handleClick} text="LOG IN" />
                </FormControl>
            </FormControl>
        </Box>
    );
};

export default LoginForm;