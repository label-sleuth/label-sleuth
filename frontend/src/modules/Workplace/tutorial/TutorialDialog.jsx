import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import './index.css'
import info_icon from "../../../assets/workspace/help.svg";

export default function TutorialDialog({open, setOpen, setTutorialOpen}) {

  const handleClose = () => {
    setOpen(false);
  };

  const handleAgree = () => {
    setTutorialOpen(true)
    setOpen(false)
  }

  return (
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Do you  want to go through a quick tutorial?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            You can always do it by clicking on
            <img src={info_icon} className="tutorial-icon" alt="Open Tutorial" />
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>No</Button>
          <Button onClick={handleAgree} autoFocus>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
  );
}
