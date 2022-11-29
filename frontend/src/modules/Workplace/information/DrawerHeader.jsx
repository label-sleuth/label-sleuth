import { styled } from "@mui/material/styles";

export const DrawerHeader = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing(0, 2),
    ...theme.mixins.toolbar,
  }));