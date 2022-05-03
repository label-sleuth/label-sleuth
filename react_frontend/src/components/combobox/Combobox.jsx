import React from "react"
import {} from "./Combobox.module.css"

const Combobox = ({ name, options,handleChange, ...rest }) => {
    return (
        <select id={name} onChange={handleChange} name={name} {...rest}>
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.title}
                </option>
            ))}
        </select>
    )
}

export default Combobox