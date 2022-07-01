import * as React from 'react';
import { Stack } from "@mui/material";
import {
  LargeTitle,
  MainContent,
  PrimaryButton,
  SecondaryButton,
} from "./components";
import info_icon from "../../../assets/workspace/help.svg";
import { Box, Modal } from "@mui/material";

export default function TutorialDialog({open, setOpen, setTutorialOpen}) {

  const handleClose = () => {
    setOpen(false);
  };

  const handleAgree = () => {
    setTutorialOpen(true)
    setOpen(false)
  }

  return (
    <Modal
    open={open}
    onClose={handleClose}
    disableAutoFocus
    >
    <Box className='tutorial-dialog-content' >
      <div
        style={{
          margin: "25px",
          display: "block",
        }}
      >
        <LargeTitle>Do you  want to go through a quick tutorial?</LargeTitle>
        <MainContent>
            <p>
                You can always start it by clicking on
                <img src={info_icon} className="tutorial-icon" alt="Open Tutorial" />
            </p>
        </MainContent>
      </div>
      <Stack
        direction="row"
        justifyContent="flex-end"
        alignItems="flex-end"
        spacing={0}
        style={{ width: "100%", flex: "none", order: 1, flexGrow: 0, marginTop: "15px" }}
      >
        <SecondaryButton onClick={handleClose} >
            No
        </SecondaryButton>
        <PrimaryButton
          onClick={handleAgree}>Yes
        </PrimaryButton>
      </Stack>
    </Box>
  </Modal>
  );
}
