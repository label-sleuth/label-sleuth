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
import { Box, Stack, SxProps, Theme, Typography } from "@mui/material";
import { ReactNode, useMemo } from "react";

export interface DropdownOption {
  value: string;
  title: string;
  caption?: string;
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
  sx?: SxProps<Theme>;
  itemMinWidth?: string;
  itemTextSx?: SxProps<Theme>; 
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
  sx,
  itemMinWidth,
  itemTextSx,
}: ControlledSelectProps) => {
  const ITEM_HEIGHT = 30;

  // category name with max size (100 characters) spans 800 px -> 8px per character
  const maxOptionTitleLength = useMemo(() => {
    return Math.max(...options.map((o) => o.title.length));
  }, [options]);

  const maxOptionTitlePx = useMemo(() => {
    return Math.min(800, maxOptionTitleLength * 9);
  }, [maxOptionTitleLength]);

  const MenuProps = {
    PaperProps: {
      style: {
        maxWidth: `${maxOptionTitlePx}px`,
        minWidth: itemMinWidth || "300px",
        maxHeight:
          itemHeightCount !== null ? itemHeightCount * ITEM_HEIGHT : "none",
      },
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

  const getRenderValue = (value: string): ReactNode => {
    if (value !== "") {
      return (
        <Typography>
          {options.find((o) => o.value === value)?.title || ""}
        </Typography>
      );
    } else if (options.length > 0) {
      return placeholder;
    } else {
      return noOptionsPlaceholder;
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
        renderValue={getRenderValue}
        onChange={handleChange}
        onFocus={handleFocus}
        MenuProps={MenuProps}
        className={value !== "" ? classes.dropdown : classes.dropdown_gray}
        disabled={options.length === 0}
        sx={sx}
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
                <Stack direction={"column"}>
                  <Typography sx={itemTextSx}>
                    {option.title ?? option.value}
                  </Typography>
                  {option.caption !== undefined && (
                    <Typography
                      variant="caption"
                      sx={{
                        whiteSpace: "break-spaces",
                        pt: 0,
                        mb: 0,
                        textAlign: "justify",
                      }}
                      paragraph={true}
                    >
                      {option.caption && option.caption.trim() !== ""
                        ? option.caption
                        : "No description"}
                    </Typography>
                  )}
                </Stack>
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
