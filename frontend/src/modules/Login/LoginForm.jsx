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

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from "react-router-dom";
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Box from '@mui/material/Box';
import ButtonIBM from "../../components/buttons/ButtonIBM"
import { getAuthenticated, clearState } from './LoginSlice';
import 'react-toastify/dist/ReactToastify.css';
import classes from "./login.module.css";
import sleuth_logo from "../../assets/sleuth_logo_white.svg"
import {WORKSPACE_CONFIG_PATH } from '../../config';
import buttonIBMClasses from "../../components/buttons/Buttons.module.css"

const LoginForm = () => {
    
    let navigate = useNavigate();
    const dispatch = useDispatch()
    const { token } = useSelector((state) => state.authenticate)

    useEffect(() => {
        if (token) {
            navigate(WORKSPACE_CONFIG_PATH)
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

    const handleLogin = () => {
        dispatch(clearState())
        dispatch(getAuthenticated({ username: username, password: password }))
    }

    return (
        <Box>
            <div className={classes.sleuth_header}>
                <img alt="existing workspace" src={sleuth_logo} className={classes.sleuthlogo} />
            </div>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '1px',
                width: 'auto',
                height: 'auto',
                padding: '0',
                background: '#f4f4f4',
                borderLeft: 'solid 1px #eaeaea',
                borderTop: 'solid 1px #eaeaea',
                borderRight: 'solid 1px #b8b8b8',
                borderBottom: 'solid 1px #b8b8b8',
            }}>
                <FormControl variant="standard" sx={{ m: 1, minWidth: 350, padding: 0, margin: 0 }}>
                    <FormLabel sx={{ color: "#393939", fontWeight: '600', fontSize: '1.5rem', padding: '25px' }}>Login</FormLabel>
                    <FormControl sx={{ paddingLeft: '25px', paddingTop: '15px', paddingBottom: '10px', background: '#fff', borderBottom: 'solid 1px #eaeaea'}}>
                        <TextField 
                            required 
                            onChange={handleUserName} 
                            label="Username" 
                            variant="standard"
                            InputProps={{disableUnderline: true}}
                            inputProps={{
                                sx: {
                                    "&::placeholder": {
                                        color: "#b5b5b5"
                                    }
                                }
                            }}
                            InputLabelProps={{ shrink: true }}
                            placeholder="sleuth@ibm.com"
                        />
                    </FormControl>
                    <FormControl sx={{ paddingLeft: '25px', paddingTop: '15px', paddingBottom: '10px', marginBottom: '10px', background: '#fff'}}>
                        <TextField 
                            required
                            type="password"
                            onChange={handlePassword}
                            label="Password"
                            variant="standard"
                            InputProps={{
                                disableUnderline: true
                            }}
                            inputProps={{
                                sx: {
                                    "&::placeholder": {
                                      color: "#b5b5b5"
                                    }
                                }
                            }}
                            InputLabelProps={{ shrink: true }}
                            placeholder="***"
                        />
                    </FormControl>
                    <div style={{width: '100%', display: 'flex', justifyContent: 'right', marginTop: '20px'}}>
                        <ButtonIBM onClick={handleLogin} text="Log In" className={buttonIBMClasses["button-ibm"]}/>
                    </div>
                </FormControl>
            </Box>
        </Box>
    );
};

export default LoginForm;