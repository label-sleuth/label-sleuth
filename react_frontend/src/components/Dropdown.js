import * as React from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

export default function SelectVariants({ name, options, label, handleChange, ...rest }) {

  return (
      <FormControl variant="standard" sx={{ m: 1, minWidth: 200 }}>
        <InputLabel id="demo-simple-select-standard-label">{label}</InputLabel>
        <Select
          labelId="demo-simple-select-standard-label"
          id={name}
          value={name}
          label= {label}
          onChange={handleChange}
        >
         {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                  {option.title}
              </MenuItem>
          ))}
        </Select>
      </FormControl>
  );
}
 