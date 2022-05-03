import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { useDispatch, useSelector } from 'react-redux';
import { createNewCategory } from '../DataSlice';
import TextField from '@mui/material/TextField';


const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

export default function CreateCategoryModal(props) {

  const { open, setOpen } = props;

  const [text, setText] = React.useState("");

  const dispatch = useDispatch()


  const handleTextFieldChange = (e) => {
    setText(e.target.value)
  }

//   const [open, setOpen] = React.useState(false);
//   const handleOpen = () => setOpen(true);
//   const handleClose = () => setOpen(false);

  return (
    <div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ marginBottom: 2 }}>
            Please enter new category:
          </Typography>
          <Box>
            <TextField id="outlined-basic" label="Outlined" variant="outlined" onChange={handleTextFieldChange} />
            <Button variant="contained" onClick={() => {
                console.log(`button called`)
                dispatch(createNewCategory(text))
                setOpen(false)
            }} sx={{ marginLeft: 3 }}>Create</Button>
          </Box>

        </Box>
      </Modal>
    </div>
  );
}