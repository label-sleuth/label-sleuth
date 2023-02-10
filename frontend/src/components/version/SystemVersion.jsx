import { useSelector } from "react-redux";
import { Typography } from "@mui/material";
import classes from "./version.module.css";

export const SystemVersion = ({ style }) => {
  const systemVersion = useSelector((state) => state.workspace.systemVersion);
  console.log(systemVersion);
  return (
    systemVersion && (
      <Typography variant="body2" className={classes["system-version"]} style={style}>
        Version: {systemVersion}
      </Typography>
    )
  );
};
