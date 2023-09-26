/*
    Copyright (c) 2022 IBM Corp.
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import classes from "./index.module.css";
import {
  CREATE_NEW_CATEGORY_PLACEHOLDER_MSG,
  WRONG_INPUT_NAME_LENGTH,
  CATEGORY_NAME_MAX_CHARS,
  CustomizableUITextEnum,
} from "../../../../const";
import {
  DialogContentText,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  InputAdornment,
  Menu,
} from "@mui/material";
import { ChangeEvent } from "react";
import { useAppSelector } from "../../../../customHooks/useRedux";
import { badgePalettes, onEnter, returnByMode } from "../../../../utils/utils";
import { CategoryBadge } from "../../../../components/categoryBadge/CategoryBadge";
import { BadgeColor } from "../../../../global";

interface ColorPickerMenuProps {
  anchorEl: (EventTarget & globalThis.Element) | null;
  open: boolean;
  setColorPickerMenuOpenAnchorEl: any;
  categoryColor?: BadgeColor;
  setCategoryColor: React.Dispatch<
    React.SetStateAction<BadgeColor | undefined>
  >;
}

const ColorPickerMenu = ({
  anchorEl,
  open,
  setColorPickerMenuOpenAnchorEl,
  categoryColor,
  setCategoryColor,
}: ColorPickerMenuProps) => {
  const handleClose = (e: any) => {
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
        {/* <TwitterPicker
              colors={Object.values(badgePalettes).map((bp) => bp[500])}
            /> */}
        <Grid container spacing={1}>
          {Object.entries(badgePalettes).map(([k, v], i) => (
            <Grid item xs={2} key={i}>
              <Box
                onClick={() => {
                  setCategoryColor({ name: k, palette: v });
                }}
                sx={{
                  width: "30px",
                  height: "30px",
                  float: "left",
                  borderRadius: "4px",
                  backgroundColor: categoryColor?.name === k ? v[500] : v[200],
                  boxShadow:
                    categoryColor?.name === k ? `0 0 4px ${v[500]}` : "none",
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

interface EditOrCreateCategoryModalProps {
  categoryName: string;
  setCategoryName: React.Dispatch<React.SetStateAction<string>>;
  categoryDescription: string;
  setCategoryDescription: React.Dispatch<React.SetStateAction<string>>;
  categoryColor?: BadgeColor;
  setCategoryColor: React.Dispatch<
    React.SetStateAction<BadgeColor | undefined>
  >;
  categoryNameError: string;
  setCategoryNameError: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: () => void;
  open: boolean;
  dialogTitle: string;
  onModalClose: () => void;
  submitButtonLabel: string;
}

export const EditOrCreateCategoryModal = ({
  categoryName,
  setCategoryName,
  categoryDescription,
  setCategoryDescription,
  categoryColor,
  setCategoryColor,
  categoryNameError,
  setCategoryNameError,
  open,
  dialogTitle,
  onModalClose,
  onSubmit,
  submitButtonLabel,
}: EditOrCreateCategoryModalProps) => {
  const [colorPickerMenuOpenAnchorEl, setColorPickerMenuOpenAnchorEl] =
    React.useState<(EventTarget & globalThis.Element) | null>(null);

  const colorPickerMenuOpen = React.useMemo(
    () => Boolean(colorPickerMenuOpenAnchorEl),
    [colorPickerMenuOpenAnchorEl]
  );

  const categoryDescriptionPlaceholder = useAppSelector(
    (state) =>
      state.customizableUIText.texts[
        CustomizableUITextEnum.CATEGORY_DESCRIPTION_PLACEHOLDER
      ]
  );

  const categoryModalHelperText = useAppSelector(
    (state) =>
      state.customizableUIText.texts[
        CustomizableUITextEnum.CATEGORY_MODAL_HELPER_TEXT
      ]
  );

  const mode = useAppSelector((state) => state.workspace.mode);

  const handleCategoryNameFieldChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    e.preventDefault();
    let text = e.target.value;
    if (text) {
      if (text.length > CATEGORY_NAME_MAX_CHARS) {
        setCategoryNameError(WRONG_INPUT_NAME_LENGTH(CATEGORY_NAME_MAX_CHARS));
      } else setCategoryNameError("");
    } else {
      setCategoryNameError("");
    }
    setCategoryName(text);
  };

  const handleCategoryDescriptionFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    e.preventDefault();
    let text = e.target.value;
    setCategoryDescription(text);
  };

  return (
    <Dialog
      open={open}
      onClose={onModalClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      disableRestoreFocus
      onKeyDown={(e) => e.stopPropagation()}
    >
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ width: "300px" }}>
          {categoryModalHelperText}
        </DialogContentText>
        <Box
          component="form"
          sx={{
            "& .MuiTextField-root": { m: 1, width: "35ch" },
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            mt: 2,
          }}
          noValidate
          autoComplete="off"
        >
          <TextField
            id="outlined-basic"
            sx={{ marginLeft: "0 !important" }}
            label={CREATE_NEW_CATEGORY_PLACEHOLDER_MSG}
            onChange={handleCategoryNameFieldChange}
            error={categoryNameError ? true : false}
            autoFocus
            required
            value={categoryName}
            onKeyDown={(e) => {
              onEnter(e, onSubmit);
            }}
            InputProps={{
              endAdornment: returnByMode(
                null,
                <InputAdornment position="end">
                  <Box
                    sx={{
                      width: "25px",
                      height: "25px",
                      float: "left",
                      borderRadius: "4px",
                      backgroundColor: categoryColor?.palette[500],
                      cursor: "pointer",
                    }}
                    onClick={(event: React.UIEvent) => {
                      event.stopPropagation();
                      setColorPickerMenuOpenAnchorEl(event.currentTarget);
                    }}
                  />
                </InputAdornment>,
                mode
              ),
            }}
          />

          <p className={classes["error"]}>{categoryNameError}</p>
          {returnByMode(
            null,
            categoryName && categoryColor && (
              <CategoryBadge
                sx={{ mb: 2 }}
                categoryName={categoryName}
                color={{
                  name: Object.keys(badgePalettes).find(
                    (k) => categoryColor.name === k
                  ) as string,
                  palette: Object.values(badgePalettes).find(
                    (bp) => bp === categoryColor.palette
                  ) as BadgeColor["palette"],
                }}
              />
            ),
            mode
          )}

          <TextField
            label="Category description"
            placeholder={categoryDescriptionPlaceholder}
            sx={{
              marginLeft: "0 !important",
              "& .MuiFormHelperText-root": {
                ml: 0,
                mt: 1,
              },
            }}
            multiline
            rows={6}
            onChange={handleCategoryDescriptionFieldChange}
            helperText={"* indicates required field"}
            value={categoryDescription}
          />
          <Button
            onClick={onSubmit}
            className={
              categoryNameError || !categoryName
                ? classes["btn-disabled"]
                : classes.btn
            }
            disabled={categoryNameError !== "" || categoryName === ""}
            sx={{ mt: 1 }}
            role="button"
          >
            {submitButtonLabel}
          </Button>
        </Box>
      </DialogContent>
      <ColorPickerMenu
        open={colorPickerMenuOpen}
        anchorEl={colorPickerMenuOpenAnchorEl}
        setColorPickerMenuOpenAnchorEl={setColorPickerMenuOpenAnchorEl}
        setCategoryColor={setCategoryColor}
        categoryColor={categoryColor}
      />
    </Dialog>
  );
};
