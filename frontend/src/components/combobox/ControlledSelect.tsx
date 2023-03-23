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

import React, { FocusEvent, useEffect, useState } from 'react';
import classes from "./ControlledSelect.module.css";
import MenuItem from '@mui/material/MenuItem/MenuItem';
import Select, { SelectProps, SelectChangeEvent } from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';

interface ControlledSelectProps extends SelectProps<string> {
options: {
  value: string,
  label: string
} []
}


const ControlledSelect = ({ value, label, options, onFocus, onChange, onBlur, placeholder }: ControlledSelectProps) => {
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
  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    if (onFocus) {
      onFocus(e);
    }
  };
  const handleChange = (e:SelectChangeEvent<string>, child: React.ReactNode) => {
    const value = e.target.value ;
    setLocalValue(value as string);
    if (onChange) {
      onChange(e, child);
    }
  };
  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (onBlur) {
      onBlur(e);
    }
  };
  return (
    <>
      <InputLabel id="demo-simple-select-helper-label">{label}</InputLabel>
      <Select
        labelId="demo-simple-select-helper-label"
        id="demo-simple-select-helper"
        value={localValue}
        renderValue={value !== "" ? undefined : () => placeholder}
        label={label}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        MenuProps={MenuProps}
        className={classes.dropdown}
      >
        {options?.map(option => {
          return (
            <MenuItem 
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