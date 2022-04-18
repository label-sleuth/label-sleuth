import * as React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';

export default function ComboBoxWithInputText({ options,  handleChange, label }) {

  return (
    <Stack spacing={3} sx={{ width: 285 }}>
      <Autocomplete
        onChange={handleChange}
        id="free-solo-demo"
        freeSolo
        options={options.map((option) => option.dataset_id)}
        renderInput={(params) => <TextField onChange={handleChange} {...params} label={label} />}
      />
    </Stack>
  );
}
