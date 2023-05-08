import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import React, { useState } from "react";
import { useAppSelector } from "../customHooks/useRedux";
import { CopyToClipboard } from "react-copy-to-clipboard";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { parseErrorId } from "../utils/utils";

interface ErrorDetailsDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface DialogTitleProps {
  children?: React.ReactNode;
  onClose: () => void;
}

const DialogTitleWithcloseIcon = (props: DialogTitleProps) => {
  const { children, onClose, ...other } = props;

  return (
    <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
      {children}
      {onClose ? (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      ) : null}
    </DialogTitle>
  );
};

export const ErrorDetailsDialog = ({
  open,
  setOpen,
}: ErrorDetailsDialogProps) => {
  const error = useAppSelector((state) => state.error.error);

  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    error && (
      <>
        <Dialog maxWidth="md" open={open} onClose={handleClose}>
          <DialogTitleWithcloseIcon onClose={handleClose}>
            {error.details?.title || error.title}
          </DialogTitleWithcloseIcon>
          <DialogContent sx={{ pb: 0 }}>
            <ul>
              {error.details?.items ? (
                error.details.items.map((item, i) => (
                  <li
                    style={{ overflowWrap: "break-word", marginBottom: "5px" }}
                    key={i}
                  >
                    {item}
                  </li>
                ))
              ) : error.details?.text ? (
                <Typography>{error.details.text}`</Typography>
              ) : null}
            </ul>
            <Stack direction={"row"} alignItems="center">
              <DialogContentText
                sx={{ mr: 1 }}
              >{`Share the error id with your system administrator: ${parseErrorId(
                error.request_id
              )}`}</DialogContentText>
              <CopyToClipboard
                text={parseErrorId(error.request_id) || ""}
                onCopy={() => setCopied(true)}
              >
                <Tooltip title={"Copy to clipboard"} placement="top">
                  <IconButton aria-label="copy" size="small">
                    <ContentCopyIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </CopyToClipboard>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Close</Button>
          </DialogActions>
        </Dialog>
        <Snackbar
          message="Copied to clibboard"
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          autoHideDuration={2000}
          open={copied}
          onClose={() => setCopied(false)}
        />
      </>
    )
  );
};
