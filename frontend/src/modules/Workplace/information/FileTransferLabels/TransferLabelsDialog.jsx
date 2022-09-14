import * as React from "react";
import { Stack, List, ListItem } from "@mui/material";
import {
  LargeTitle,
  MainContent,
  PrimaryButton,
  SecondaryButton,
} from "../../../../components/dialog";
import { Box, Modal, TextField } from "@mui/material";
import "./styles.css";
import { useDispatch, useSelector } from "react-redux";
import {
  uploadLabels,
  downloadLabels,
  downloadModel,
} from "../../redux/DataSlice";
import { curCategoryNameSelector } from "../../redux/DataSlice";

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

  const bullets = {
    text: "all elements in the current workspace which are exactly equal to text will be assigned with label for category_name (overriding existing labels).",
    category_name:
      "the category for which the element is labeled. If this category does not exist in the current workspace, it will be automatically created.",
    label: "true/false or 1/0.",
    document_id:
      "an optional column - if provided, label will be applied only to the elements in document_id matching text (as opposed to in the entire current workspace).",
  };

  return (
    <Modal open={open} onClose={handleClose} disableRestoreFocus>
      <Box className="dialog-content">
        <div
          style={{
            margin: "25px 15px 0 15px",
            display: "block",
          }}
        >
          <LargeTitle>Upload existing labels to the workspace</LargeTitle>
          <MainContent>
            <p style={{ marginBotton: 0 }}>
              This input is a CSV file, in which each row is a labeled element,
              and its columns are: <br />
            </p>
            <ul>
              {Object.entries(bullets).map(([name, text]) => (
                <li key={name} style={{ paddingBottom: "10px" }}>
                  <i>{name}</i>: {text}
                </li>
              ))}
            </ul>
          </MainContent>
        </div>
        <Stack
          direction="row"
          justifyContent="flex-end"
          alignItems="flex-end"
          spacing={0}
          style={{ width: "100%", order: 1, flexGrow: 0 }}
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
    <Modal open={open} onClose={handleClose} disableRestoreFocus>
      <Box className="dialog-content">
        <div
          style={{
            margin: "25px 25px 10px 25px",
            display: "block",
          }}
        >
          <LargeTitle>Download labels from the workspace</LargeTitle>
          <MainContent>
            <p>
              Download all labels from the workspace as a csv file. Each row in
              the csv is a label for a specific element for a specific category.
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

export const DownloadModelDialog = ({
  open,
  setOpen,
  modelVersion,
  modelVersionSuffix,
}) => {
  const curCategoryName = useSelector(curCategoryNameSelector);
  const dispatch = useDispatch();
  const handleClose = () => {
    setOpen(false);
  };

  const onClick = () => {
    dispatch(downloadModel());
    setOpen(false);
  };

  return (
    <Modal open={open} onClose={handleClose} disableRestoreFocus>
      <Box className="dialog-content">
        <div
          style={{
            margin: "25px 25px 10px 25px",
            display: "block",
          }}
        >
          <LargeTitle>Download the current model</LargeTitle>
          <MainContent>
            <p>
              Download the latest ({modelVersion}
              <sup>{modelVersionSuffix}</sup>) model version for the category '
              {curCategoryName}'. In the downloaded zip file you will find the
              model itself, as well as a code snippet demonstrating how it can
              be used within a python application.
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
