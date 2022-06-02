import React from "react"
import classes from "./Buttons.module.css"
import LoadingButton from '@mui/lab/LoadingButton';

const LoadingButtonIBM = () => {
    return (
        <LoadingButton className={classes["button-ibm"]} variant='contained' loading> </LoadingButton>
    )
}

export default LoadingButtonIBM