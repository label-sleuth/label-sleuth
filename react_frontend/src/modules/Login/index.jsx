
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux'
import LoginForm from "../Login/LoginForm"
import classes from "./login.module.css"

const Login = () => {

    return (
        <div className={classes.container}>
            <LoginForm />
        </div>
    )
};

const login = {
    routeProps: {
        path: "/login",
        element: <Login />
    },
    name: 'login'
}
export default login;