import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { useDispatch, useSelector } from 'react-redux';
import { createNewCategory, createCategoryOnServer, fetchCategories, setWorkspaceLength, updateCurCategory } from '../../DataSlice';
import TextField from '@mui/material/TextField';
import classes from './index.module.css';


const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 350,
  bgcolor: 'background.paper',
  border: 'none',
  boxShadow: 24,
  p: 4,
};

export default function CreateCategoryModal(props) {

  const workspace = useSelector(state => state.workspace)

  const { open, setOpen } = props;

  const [text, setText] = React.useState("");

  const dispatch = useDispatch()


  const handleTextFieldChange = (e) => {
    setText(e.target.value)
  }


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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <TextField id="outlined-basic" className={classes.new_modal_name} label="New Model Name" onChange={handleTextFieldChange} />
            <Button onClick={() => {
              console.log(`button called`)
              // dispatch(createNewCategory(text))
              const newCategoryName = text.trim()
              dispatch(createCategoryOnServer({ category: newCategoryName })).then(() => fetchCategories())
              dispatch(createNewCategory(newCategoryName))
              dispatch(fetchCategories())
              dispatch(setWorkspaceLength(workspace.categories.length + 1))
              dispatch(updateCurCategory(newCategoryName))
              setOpen(false)
            }} className={classes.btn} sx={{ marginLeft: 3 }}>Create</Button>
          </Box>

        </Box>
      </Modal>
    </div>
  );
}