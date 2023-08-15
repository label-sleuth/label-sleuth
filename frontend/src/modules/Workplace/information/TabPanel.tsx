import { Box, SxProps } from "@mui/material";

interface TabPanelProps {
  children: React.ReactElement;
  value: number;
  index: number;
  className: string;
  sx?: SxProps;
}

export const TabPanel = ({ children, value, index, sx, ...other }: TabPanelProps) => {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      sx={{
        ...sx,
      }}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </Box>
  );
};
