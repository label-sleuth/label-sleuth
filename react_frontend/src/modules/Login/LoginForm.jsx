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

    }, [navigate, token])

    const [username, setUserName] = useState('');
    const handleUserName = (e) => {
        setUserName(e.target.value);
    };
    const [password, setPassword] = useState('');
    const handlePassword = (e) => {
        setPassword(e.target.value);
    };

    const handleClick = () => {
        dispatch(clearState())
        dispatch(getAuthenticated({ username: username, password: password }))
    }

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '5px',
            width: 450,
            height: 450,
            backgroundColor: 'f48c06',
            boxShadow: '0 0 20px 5px rgb(0 0 0 / 30%)'
        }}>
            <FormControl variant="standard" sx={{ m: 1, minWidth: 350 }}>
                <FormLabel sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: "#f48c06", fontSize: '1.5rem' }}>Login</FormLabel>
                <FormControl variant="standard" sx={{ m: 1 }}>
                    <TextField required onChange={handleUserName} id="standard-basic" label="Username" variant="standard" />
                </FormControl>
                <FormControl variant="standard" sx={{ m: 1, marginTop: '20px' }}>
                    <TextField required onChange={handlePassword} id="standard-basic" label="Password" variant="standard" />
                </FormControl>
                {errorMessage &&
                    <FormLabel sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'red' }}>Login failed!</FormLabel>
                }
                <FormControl variant="standard" sx={{ mt: 3, alignItems: 'center', justifyContent: 'center', height: '50px', marginTop: '50px' }}>
                    <ButtonLight onClick={handleClick} text="LOG IN" />
                </FormControl>
            </FormControl>
        </Box>
    );
};

export default LoginForm;