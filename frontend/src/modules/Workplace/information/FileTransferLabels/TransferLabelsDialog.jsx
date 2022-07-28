import * as React from "react";
import { Stack } from "@mui/material";
import {
  LargeTitle,
  MainContent,
  PrimaryButton,
  SecondaryButton,
} from "../../../../components/dialog";
import { Box, Modal, TextField } from "@mui/material";
import "./styles.css";
import { useDispatch } from "react-redux";
import { uploadLabels, downloadLabels } from "../../DataSlice";

export const UploadLabelsDialog = ({ open, setOpen }) => {
  const dispatch = useDispatch();

  const handleClose = () => {
    setOpen(false);
  };

  const handleFileSelection = (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    dispatch(uploadLabels(formData));
    setOpen(false);
  };

  return (
    <Modal open={open} onClose={handleClose} disableRestoreFocus >
      <Box className="dialog-content">
        <div
          style={{
            margin: "25px",
            display: "block",
          }}
        >
          <LargeTitle>Upload labels to the workspace</LargeTitle>
          <MainContent>
            <p>
              This action requires a csv file that must include <i>text</i>,{" "}
              <i>category_name</i> and <i>label</i> columns, and may optionally
              include a<i>document_id</i> column.
            </p>
          </MainContent>
        </div>
        <Stack
          direction="row"
          justifyContent="flex-end"
          alignItems="flex-end"
          spacing={0}
          style={{ width: "100%", order: 1, flexGrow: 0, marginTop: "15px" }}
        >
          <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
          <PrimaryButton component="label" sx={{ textTransform: "none" }}>
            Upload
            <TextField
              onChange={handleFileSelection}
              sx={{ display: { xs: "none" } }}
              type="file"
              inputProps={{ accept: ".csv" }}
            />
          </PrimaryButton>
        </Stack>
      </Box>
    </Modal>
  );
};

export const DownloadLabelsDialog = ({ open, setOpen }) => {
  const dispatch = useDispatch();

  const handleClose = () => {
    setOpen(false);
  };

  const onClick = () => {
    dispatch(downloadLabels());
    setOpen(false);
  };

  return (
    <Modal open={open} onClose={handleClose}disableRestoreFocus >
      <Box className="dialog-content">
        <div
          style={{
            margin: "25px",
            display: "block",
          }}
        >
          <LargeTitle>Download labels from the workspace</LargeTitle>
          <MainContent>
            <p>
              Download all labels from the workspace as a csv
              file. Each row in the csv is a label for a specific element for a
              specific category.
            </p>
          </MainContent>
        </div>
        <Stack
          direction="row"
          justifyContent="flex-end"
          alignItems="flex-end"
          spacing={0}
          style={{ width: "100%", order: 1, flexGrow: 0, marginTop: "15px" }}
        >
          <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
          <PrimaryButton sx={{ textTransform: "none" }} onClick={onClick}>
            Download
          </PrimaryButton>
        </Stack>
      </Box>
    </Modal>
  );
};
