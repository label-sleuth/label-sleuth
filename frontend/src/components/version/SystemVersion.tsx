import classes from "./version.module.css";
import { useAppSelector } from "../../customHooks/useRedux";
import { Typography } from "@mui/material";

export const SystemVersion = ({ style }: { style?: React.CSSProperties }) => {
  const systemVersion = useAppSelector((state) => state.workspace.systemVersion);
  return systemVersion !== "" && systemVersion !== null ? (
    <Typography variant="body2" className={classes["system-version"]} style={style}>
      Version: {systemVersion}
    </Typography>
  ) : null;
};
