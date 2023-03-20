import { Typography } from "@mui/material";

interface TooltipTitleWithShortcutProps {
  icon: React.ReactElement;
  title: string;
}

export const TooltipTitleWithShortcut = ({ icon, title }: TooltipTitleWithShortcutProps) => {
  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
      <Typography fontSize={11}>
        {title} {"("}
      </Typography>
      &nbsp;
      {icon}
      &nbsp;<Typography fontSize={11}>{" )"}</Typography>
    </div>
  );
};
