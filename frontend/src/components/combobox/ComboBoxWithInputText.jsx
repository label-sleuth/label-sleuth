import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import { forwardRef } from 'react';

const ComboBoxWithInputText = forwardRef(({ options, handleInputChange, label, placeholder }, ref) => {
  return (
    <Stack spacing={3} sx={{ width: '100%' }} >
      <Autocomplete
        onChange={handleInputChange}
        onSelect={handleInputChange}
        id="free-solo-demo"
        freeSolo
        options={options && options.map((option) => option.dataset_id)}
        renderInput={(params) =>
          <TextField
            inputRef={ref}
            onChange={handleInputChange}
            {...params}
            label={label}
            variant="standard"
            InputLabelProps={{
              ...params.InputLabelProps,
              shrink: true,
              style: {
                fontSize: '18px',
                marginTop: '-8px'
              }
            }}
            InputProps={{
              ...params.InputProps,
              style: {
                background: '#fff',
                padding: '6px 10px',
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
})
export default ComboBoxWithInputText