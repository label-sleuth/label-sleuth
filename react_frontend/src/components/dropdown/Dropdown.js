import React, { useEffect, useState } from 'react';

import MenuItem from '@mui/material/MenuItem/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import classes from "./Dropdown.module.css";


const ControlledSelect = ({ value, label, options, onFocus, onChange, onBlur, placeholder }) => {
  const ITEM_HEIGHT = 30;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        // width: 250,
      },
    },
  };
  const [localValue, setLocalValue] = useState(value ?? '');   
  useEffect(() => setLocalValue(value ?? ''), [value]);       
  const handleFocus = () => {
    if (onFocus) {
      onFocus();
    }
  };
  const handleChange = (e) => {
    const value = e.target.value;
    setLocalValue(value);
    if (onChange) {
      onChange(value);
    }
  };
  const handleBlur = (e) => {
    if (onBlur) {
      onBlur(e.target.value);
    }
  };
  
  return (
    <>
      <InputLabel 
        id="demo-simple-select-helper-label"
        shrink={true}
        style={{
            fontSize: '18px',
            marginTop: '-8px'
        }}
      >{label}</InputLabel>
      <Select
        labelId="demo-simple-select-helper-label"
        id="demo-simple-select-helper"
        value={localValue}
        label={label}
        displayEmpty
        renderValue={value !== "" ? undefined : () => placeholder}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        MenuProps={MenuProps}
        notched={true}
        className={value !== "" ? classes.dropdown : classes.dropdown_gray}
      >
        {options?.map(option => {
        return (
            <MenuItem 
                style={{
                    minHeight: '40px'
                }}
                key={option.value} value={option.value}>
                {option.label ?? option.value}
            </MenuItem>
        );
        })}
      </Select>
    </>

  );
};

export default ControlledSelect;