import { Button, Stack, Typography, useTheme } from "@mui/material";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";

interface LabeledDataActionsProps {
  setDownloadLabelsDialogOpen: (value: boolean) => void;
  setUploadLabelsDialogOpen: (value: boolean) => void;
}

export const LabeledDataActions = ({
  setDownloadLabelsDialogOpen,
  setUploadLabelsDialogOpen,
}: LabeledDataActionsProps) => {
  const theme = useTheme();
  return (
    <Stack
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "start",
        flexGrow: "1",
        ml: 2,
      }}
    >
      <Typography>Workspace labeled data:</Typography>
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
        }}
      >
        <Button
          onClick={() => setDownloadLabelsDialogOpen(true)}
          startIcon={<FileDownloadOutlinedIcon />}
          sx={{ textTransform: "none" }}
        >
          Download
        </Button>
      </Stack>
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
        }}
      >
        <Button
          startIcon={<FileUploadOutlinedIcon />}
          component="label"
          onClick={() => setUploadLabelsDialogOpen(true)}
          sx={{ textTransform: "none" }}
        >
          Upload
        </Button>
      </Stack>
    </Stack>
  );
};
