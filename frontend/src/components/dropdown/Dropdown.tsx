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

import MenuItem from "@mui/material/MenuItem/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import classes from "./Dropdown.module.css";

export interface DropdownOption {
  value: string;
  title: string;
}

interface ControlledSelectProps {
  value: string;
  label: string;
  options: DropdownOption[];
  placeholder?: string;
  noOptionsPlaceholder?: string;
  aria?: string;
  onFocus?: () => void;
  onChange?: (value: string) => void;
  itemHeightCount?: number | null; // number of limits before adding scroll
}

const ControlledSelect = ({
  value,
  label,
  options,
  onFocus,
  onChange,
  placeholder,
  noOptionsPlaceholder,
  aria = "demo-simple-select",
  itemHeightCount = 5,
}: ControlledSelectProps) => {
  const ITEM_HEIGHT = 30;
  const MenuProps = {
    PaperProps: {
      style:
        itemHeightCount !== null
          ? {
              maxHeight: itemHeightCount * ITEM_HEIGHT,
            }
          : {},
    },
  };
  const handleFocus = () => {
    if (onFocus) {
      onFocus();
    }
  };

  const handleChange = (e: SelectChangeEvent<string>) => {
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
        renderValue={
          value !== ""
            ? undefined
            : () => (options.length > 0 ? placeholder : noOptionsPlaceholder)
        }
        onChange={handleChange}
        onFocus={handleFocus}
        MenuProps={MenuProps}
        className={value !== "" ? classes.dropdown : classes.dropdown_gray}
        disabled={options.length === 0}
      >
        {options?.map((option) => {
          if (option.value !== "") {
            return (
              <MenuItem
                style={{
                  minHeight: ITEM_HEIGHT,
                }}
                key={option.value}
                value={option.value}
              >
                {option.title ?? option.value}
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
