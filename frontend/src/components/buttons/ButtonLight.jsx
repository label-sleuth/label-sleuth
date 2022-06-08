import React from "react"
import classes from "./Buttons.module.css"

const ButtonLight = ({ handleClick, disabled, size, text, ...rest }) => {
    return (
        <button className={classes["button-light"]}  onClick={handleClick} {...rest}>
            {text}
        </button>
    )
}

export default ButtonLight