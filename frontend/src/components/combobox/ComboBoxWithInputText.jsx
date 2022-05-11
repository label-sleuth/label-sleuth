import * as React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';

export default function ComboBoxWithInputText({ options,  handleInputChange, label }) {

  return (
    <Stack spacing={3} sx={{ width: 285 }}>
      <Autocomplete
        onChange={handleInputChange}
        onSelect={handleInputChange}
        id="free-solo-demo"
        freeSolo
        ListboxProps={{ style: { maxHeight: '140px' } } }
        options={options && options.map((option) => option.dataset_id)}
        renderInput={(params) => <TextField onChange={handleInputChange} {...params} label={label} />}
      />
    </Stack>
  );
}
