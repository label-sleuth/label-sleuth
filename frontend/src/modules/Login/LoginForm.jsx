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
import sleuth_logo from "../../assets/sleuth_logo.png"
import { APP_NAME, WORKSPACE_CONFIG_PATH } from '../../config';

const LoginForm = () => {
    
    let navigate = useNavigate();
    const dispatch = useDispatch()
    const { token, errorMessage } = useSelector((state) => state.authenticate)

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
                <img alt="existing workspace" src={sleuth_logo} style={{ width: '16px', height: '16px', marginRight: '6px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0, paddingTop: '2px'}}>{APP_NAME}</h4>
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
                    {errorMessage &&
                        <label className={classes.login_error}><b style={{fontWeight: 600}}>Login Error:</b> An Unexpected Error Occurred</label>
                    }
                    <div style={{width: '100%', display: 'flex', justifyContent: 'right', marginTop: '20px'}}>
                        <ButtonIBM onClick={handleLogin} text="Log In" />
                    </div>
                </FormControl>
            </Box>
            <label className={classes.reach_out}>
                Having trouble? Contact <a href="https://research.ibm.com/" target='_blank' style={{ fontWeight: '600', textDecoration: 'underline', color: '#2162FE'}}>IBM Sleuth Team</a>.
            </label>
        </Box>
    );
};

export default LoginForm;