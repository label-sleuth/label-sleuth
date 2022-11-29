import { styled } from "@mui/material/styles";

export const StatsContainer = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    fontSize: 14,
    justifyContent: "space-between",
    paddingTop: theme.spacing(1),
  }));