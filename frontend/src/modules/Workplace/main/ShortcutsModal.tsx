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

import { LargeTitle, MainContent } from "../../../components/dialog";
import { Box, Modal, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import "../information/FileTransferLabels/styles.css";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Keyboard } from "../../../components/Keyboard";

interface ShortcutsModalProps {
  open: boolean;
  setOpen: (v: boolean) => void
}

export const ShortcutsModal = ({ open, setOpen }: ShortcutsModalProps) => {
  const handleClose = () => {
    setOpen(false);
  };

  const title =
    "The followings are the keyboard shortcuts you can use. These keyboard shortcuts can be applied on the element in the right sidebar which is currently highlighted.";

  const bullets = [
    { key: "←", value: "Label the focused element as negative", fontSize: "1.5rem" },
    { key: "→", value: "Label the focused element as positive" },
    { key: "↑", value: "Focus the previous element" },
    { key: "↓", value: "Focus the next element" },
    { key: "Enter", value: "Discover the focused element in the main document view" },
    { key: "p", value: "Focus the next positive prediction" },
    { key: "o", value: "Focus the previous positive prediction" },
  ];

  return (
    <Modal open={open} onClose={handleClose} disableRestoreFocus>
      <Box className="dialog-content">
        <div
          style={{
            margin: "25px 15px 0 15px",
            display: "block",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row-reverse",
              order: 1,
              marginBottom: "-40px",
            }}
          >
            <IconButton aria-label="close" style={{ color: "white" }} onClick={() => setOpen(false)} size="medium">
              <CloseIcon fontSize="inherit" />
            </IconButton>
          </div>
          <LargeTitle>Shortcuts</LargeTitle>
          <MainContent sx={{ paddingBottom: 2 }}>
            <p>{title}</p>
            <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
              <TableContainer>
                <Table aria-label="simple table">
                  <TableBody sx={{ margin: 0 }}>
                    {bullets.map(({ key, value }) => (
                      <TableRow key={key}>
                        <TableCell align="center" sx={{ paddingBottom: 0, paddingTop: 0 }}>
                          <Keyboard kbd={key} style={{ fontSize: "1.5em" }} />
                        </TableCell>
                        <TableCell sx={{ paddingBottom: 0, paddingTop: 0 }}>
                          <p
                            style={{
                              fontFamily: "IBM Plex Sans",
                              fontStyle: "normal",
                              fontSize: "16px",
                              color: "ffffff",
                            }}
                          >
                            {value}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </ThemeProvider>
          </MainContent>
        </div>
      </Box>
    </Modal>
  );
};
