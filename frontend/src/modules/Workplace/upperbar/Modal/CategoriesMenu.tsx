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

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useAppSelector } from "../../../../customHooks/useRedux";
import { Category } from "../../../../global";
import ModeEditOutlineOutlinedIcon from "@mui/icons-material/ModeEditOutlineOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import classes from "./index.module.css";

interface CategoryEntryProps {
  category: Category;
}

const CategoryEntry = ({ category }: CategoryEntryProps) => {
  return (
    <Box
      sx={{
        mb: 1,
        pt: 1.5,
      }}
      className={classes["category-entry"]}
    >
      <Stack direction={"row"}>
        <Box
          sx={{
            width: "25px",
            height: "25px",
            float: "left",
            borderRadius: "8px",
            backgroundColor: category.color?.palette[200],
            cursor: "pointer",
            mr: 2,
          }}
        />
        <Stack direction={"column"} sx={{ maxWidth: "250px" }}>
          <Typography sx={{ mt: "-5px" }}>{category.category_name}</Typography>
          <Typography variant={"caption"} sx={{ color: "gray" }}>
            {category.category_description ||
              "Lorem inpsum descriptsion descriptum il arbre"}
          </Typography>
        </Stack>
        <Stack
          direction={"row"}
          alignItems={"flex-start"}
          className={classes["hide-on-hover"]}
          sx={{ml: 4  }}
        >
          <IconButton
            size="small"
            sx={(palette) => ({ color: palette.palette.primary.main })}
          >
            <ModeEditOutlineOutlinedIcon fontSize="inherit" />
          </IconButton>
          <IconButton
            size="small"
            sx={(palette) => ({ color: palette.palette.primary.main })}
          >
            <DeleteOutlineOutlinedIcon fontSize="inherit" />
          </IconButton>
        </Stack>
      </Stack>
      <Divider sx={{ mt: 1 }} />
    </Box>
  );
};

interface CategoriesMenuProps {
  open: boolean;
  setOpen: (newValue: boolean) => void;
}

export const CategoriesMenu = ({ open, setOpen }: CategoriesMenuProps) => {
  const categories = useAppSelector((state) => state.workspace.categories);

  const onClose = () => {
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="categories-menu"
      aria-describedby="Menu for creating, editing, deleting and viewing all the categories"
      disableRestoreFocus
      fullWidth
      maxWidth={"xs"}
    >
      <DialogTitle sx={{ p: 0, mx: 4, mt: 2, mb: 1 }}>
        <Stack direction={"row"} alignItems={"center"}>
          <Typography>{"Categories"}</Typography>
          <Box>
            <Button
              sx={{ ml: 4, textTransform: "none" }}
              startIcon={<AddCircleOutlineIcon />}
            >
              Create new
            </Button>
          </Box>
        </Stack>
        <Divider sx={{ mt: 1 }} />
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey["A700"],
        }}
      >
        <CloseIcon />
      </IconButton>
      {categories.length ? (
        <DialogContent sx={{ p: 0, mx: 4, mt: 0, mb: 3 }}>
          {categories.map((category) => (
            <CategoryEntry category={category} />
          ))}
        </DialogContent>
      ) : (
        <DialogContent>
          <DialogContentText sx={{ width: "300px" }}>
            {
              "No categories is created yet, use the 'Create new' button to create your 1st category"
            }
          </DialogContentText>
        </DialogContent>
      )}
    </Dialog>
  );
};
