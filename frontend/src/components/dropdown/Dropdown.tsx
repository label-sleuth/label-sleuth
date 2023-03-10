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

import { ReactNode } from "react";

import MenuItem from "@mui/material/MenuItem/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import classes from "./Dropdown.module.css";

interface ControlledSelectProps {
  value: string,
  label: string,
  options: {[value: string]: string}[],
  placeholder?: string,
  aria?: string;
  onFocus?: () => void,
  onChange?: (event: any) => void,
}

const ControlledSelect = ({
  value,
  label,
  options,
  onFocus,
  onChange,
  placeholder,
  aria = "demo-simple-select",
}: ControlledSelectProps) => {
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
  const handleFocus = () => {
    if (onFocus) {
      onFocus();
    }
  };
  const handleChange = (e: SelectChangeEvent<string>, child: ReactNode) => {
    const value = e.target.value;
    
     if (onChange) {
      onChange(value);
    }
  };

  return (
    <>
      <InputLabel
        id={`${aria}-label`}
        shrink={true}
        style={{
          fontSize: "18px",
          marginTop: "-8px",
        }}
      >
        {label}
      </InputLabel>
      <Select
        labelId={`${aria}-label`}
        id={`${aria}-helper`}
        value={value ?? ""}
        label={label}
        displayEmpty
        renderValue={value !== "" ? undefined : () => placeholder}
        onChange={handleChange}
        onFocus={handleFocus}
        MenuProps={MenuProps}
        className={value !== "" ? classes.dropdown : classes.dropdown_gray}
      >
        {options?.map((option) => {
          if (option.value !== "") {
            return (
              <MenuItem
                style={{
                  minHeight: "40px",
                }}
                key={option.value}
                value={option.value}
              >
                {option.label ?? option.value}
              </MenuItem>
            );
          } else {
            return null;
          }
        })}
      </Select>
    </>
  );
};

export default ControlledSelect;
