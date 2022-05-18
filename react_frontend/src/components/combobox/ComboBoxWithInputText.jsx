import * as React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';

export default function ComboBoxWithInputText({ options,  handleInputChange, label, placeholder }) {

  return (
    <Stack spacing={3} sx={{ width: 285 }}>
      <Autocomplete
        onChange={handleInputChange}
        onSelect={handleInputChange}
        id="free-solo-demo"
        freeSolo
        options={options && options.map((option) => option.dataset_id)}
        renderInput={(params) => 
        <TextField 
          onChange={handleInputChange}
          {...params}
          label={label} 
          variant="standard"
          inputProps={{
              style: {
                  background: '#fff',
                  padding: '9px',
                  "&::placeholder": {
                      color: "#b5b5b5"
                  }
              }
          }}
          placeholder={placeholder}
        />}
      />
    </Stack>
  );
}
