import { Box, DialogContentText, Grid, Menu, SxProps } from "@mui/material";
import React from "react";
import { BadgeColor } from "../../global";
import { badgePalettes } from "../../utils/utils";

interface ColorPickerMenuProps {
  anchorEl: (EventTarget & globalThis.Element) | null;
  open: boolean;
  setColorPickerMenuOpenAnchorEl: any;
  categoryColor?: BadgeColor;
  setCategoryColor: (newColor: BadgeColor) => void
}

export const ColorPickerMenu = ({
  anchorEl,
  open,
  setColorPickerMenuOpenAnchorEl,
  categoryColor,
  setCategoryColor,
}: ColorPickerMenuProps) => {
  const handleClose = (e: React.UIEvent) => {
    e.stopPropagation();
    setColorPickerMenuOpenAnchorEl(null);
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <DialogContentText sx={{ fontSize: "0.9rem", pl: 2 }}>
        {"Select the category color: "}
      </DialogContentText>
      <Box sx={{ width: "250px", p: 2 }}>
        <Grid container spacing={1}>
          {Object.entries(badgePalettes).map(([k, v], i) => (
            <Grid item xs={2} key={i}>
              <Box
                onClick={() => {
                  setColorPickerMenuOpenAnchorEl(null);
                  setCategoryColor({ name: k, palette: v });
                }}
                sx={{
                  width: "30px",
                  height: "30px",
                  float: "left",
                  borderRadius: "4px",
                  backgroundColor: categoryColor?.name === k ? v[400] : v[100],
                  boxShadow:
                    categoryColor?.name === k ? `0 0 4px ${v[300]}` : "none",
                  cursor: "pointer",
                }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Menu>
  );
};

interface ColorPickerButtonInterface {
  setColorPickerMenuOpenAnchorEl: React.Dispatch<
    React.SetStateAction<(EventTarget & Element) | null>
  >;
  categoryColor: { [key: string]: string };
  sx?: SxProps;
}

// Use this component in combination with the useColorPicker custom hook
export const ColorPickerButton = ({
  categoryColor,
  setColorPickerMenuOpenAnchorEl,
  sx,
}: ColorPickerButtonInterface) => {
  return (
    <Box
      sx={{
        width: "25px",
        height: "25px",
        float: "left",
        borderRadius: "8px",
        backgroundColor: categoryColor[400],
        cursor: "pointer",
        ...sx,
      }}
      onClick={(event: React.UIEvent) => {
        event.stopPropagation();
        setColorPickerMenuOpenAnchorEl(event.currentTarget);
      }}
    />
  );
};
