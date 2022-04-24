
import React from 'react';
import LoginForm from "../Login/LoginForm"
import classes from "./login.module.css"

const Login = () => {

    return (
        <div className={classes.container}>
            <LoginForm />
        </div>
    )
};

export default Login;