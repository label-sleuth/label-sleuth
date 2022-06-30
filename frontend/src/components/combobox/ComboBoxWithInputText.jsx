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

import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import { forwardRef } from 'react';

const ComboBoxWithInputText = forwardRef(({ options, handleInputChange, label, placeholder, error, helperText }, ref) => {
  return (
    <Stack spacing={3} sx={{ width: '100%' }} >
      <Autocomplete
        onInputChange={handleInputChange}
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
            error={error  ? true : false}
            helperText={helperText}
          />}
      />
    </Stack>
  );
})
export default ComboBoxWithInputText