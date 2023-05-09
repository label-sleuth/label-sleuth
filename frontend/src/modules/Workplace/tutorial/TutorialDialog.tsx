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

import * as React from "react";
import { Stack } from "@mui/material";
import {
  LargeTitle,
  MainContent,
  PrimaryButton,
  SecondaryButton,
} from "../../../components/dialog";
import info_icon from "../../../assets/workspace/help.svg";
import { Box, Modal } from "@mui/material";

interface TutorialDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setTutorialOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const TutorialDialog = ({
  open,
  setOpen,
  setTutorialOpen,
}: TutorialDialogProps) => {
  const handleClose = () => {
    setOpen(false);
  };

  const handleAgree = () => {
    setTutorialOpen(true);
    setOpen(false);
  };

  return (
    <Modal open={open} onClose={handleClose} disableAutoFocus>
      <Box className="tutorial-dialog-content">
        <div
          style={{
            margin: "25px",
            display: "block",
          }}
        >
          <LargeTitle>Do you want to go through a quick tutorial?</LargeTitle>
          <MainContent>
            <p>
              You can always start it by clicking on
              <img
                src={info_icon}
                className="tutorial-icon"
                alt="Open Tutorial"
              />
            </p>
          </MainContent>
        </div>
        <Stack
          direction="row"
          justifyContent="flex-end"
          alignItems="flex-end"
          spacing={0}
          style={{
            width: "100%",
            flex: "none",
            order: 1,
            flexGrow: 0,
            marginTop: "15px",
          }}
        >
          <SecondaryButton onClick={handleClose}>No</SecondaryButton>
          <PrimaryButton onClick={handleAgree}>Yes</PrimaryButton>
        </Stack>
      </Box>
    </Modal>
  );
};
