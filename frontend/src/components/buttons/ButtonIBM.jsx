import React from "react"
import classes from "./Buttons.module.css"

const ButtonIBM = ({ handleClick, disabled, size, text, className, ...rest }) => {
    return (
        <button className={className}  onClick={handleClick} {...rest}>
            {text}
        </button>
    )
}

export default ButtonIBM