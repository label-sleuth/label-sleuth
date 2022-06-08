import React from "react"
import classes from "./Buttons.module.css"

const ButtonIBM = ({ handleClick, disabled, size, text, ...rest }) => {
    return (
        <button className={classes["button-ibm"]}  onClick={handleClick} {...rest}>
            {text}
        </button>
    )
}

export default ButtonIBM