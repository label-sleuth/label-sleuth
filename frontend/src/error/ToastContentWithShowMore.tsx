import { Box, Link, Typography } from "@mui/material";
import { useCallback } from "react";
import { Error } from "../global";

interface ToastContentWithShowMoreProps {
  error: Error;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ToastContentWithShowMore = ({
  error,
  setOpen,
}: ToastContentWithShowMoreProps) => {
  const onLinkClick = useCallback((e: React.UIEvent) => {
    setOpen(true);
    e.stopPropagation();
  }, [setOpen]);
  return (
    <Box>
      <Typography display="inline">{error.title} </Typography>
      <Link
        sx={{ display: "inline-block !important" }}
        underline="none"
        variant="body1"
        onClick={onLinkClick}
      >
        Show more
      </Link>
    </Box>
  );
};
