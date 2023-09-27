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
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  useAppDispatch,
  useAppSelector,
} from "../../../../customHooks/useRedux";
import { BadgeColor, Category } from "../../../../global";
import ModeEditOutlineOutlinedIcon from "@mui/icons-material/ModeEditOutlineOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import classes from "./index.module.css";
import {
  CREATE_NEW_CATEGORY_PLACEHOLDER_MSG,
  CustomizableUITextEnum,
} from "../../../../const";
import { useColorPicker } from "../../../../customHooks/useColorPicker";
import {
  ColorPickerButton,
  ColorPickerMenu,
} from "../../../../components/colorPicker/ColorPicker";
import {
  ChangeEvent,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import { badgePalettes } from "../../../../utils/utils";
import { PrimaryButton, SecondaryButton } from "../../../../components/dialog";
import {
  checkStatus,
  createCategoryOnServer,
  deleteCategory,
} from "../../redux";
import { isFulfilled } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { useNotification } from "../../../../utils/notification";

interface NewCategoryFormProps {
  categoryName: string;
  categoryDescription: string;
  color: BadgeColor | undefined;
  id: string;
  setCategoryAttribute: (
    id: string,
    key: "categoryName" | "categoryDescription" | "color",
    newValue: any
  ) => void;
  removeNewCategory: (id: string) => void;
}

const NewCategoryForm = ({
  categoryName,
  categoryDescription,
  color,
  id,
  setCategoryAttribute,
  removeNewCategory,
}: NewCategoryFormProps) => {
  const {
    colorPickerMenuOpenAnchorEl,
    setColorPickerMenuOpenAnchorEl,
    colorPickerMenuOpen,
  } = useColorPicker();

  const categoryDescriptionPlaceholder = useAppSelector(
    (state) =>
      state.customizableUIText.texts[
        CustomizableUITextEnum.CATEGORY_DESCRIPTION_PLACEHOLDER
      ]
  );

  const emptyColor = useMemo(
    () => ({
      name: "white",
      palette: badgePalettes["white"],
    }),
    []
  );

  const handleCategoryNameFieldChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    e.preventDefault();
    let text = e.target.value;
    // if (text) {
    //   if (text.length > CATEGORY_NAME_MAX_CHARS) {
    //     setCategoryNameError(WRONG_INPUT_NAME_LENGTH(CATEGORY_NAME_MAX_CHARS));
    //   } else setCategoryNameError("");
    // } else {
    //   setCategoryNameError("");
    // }
    setCategoryAttribute(id, "categoryName", text);
  };

  const handleCategoryDescriptionFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    e.preventDefault();
    let text = e.target.value;
    setCategoryAttribute(id, "categoryDescription", text);
  };

  return (
    <Box
      sx={{
        mb: 1,
        pt: 1.5,
      }}
      className={classes["category-entry"]}
    >
      <Stack direction={"row"}>
        <ColorPickerButton
          sx={{
            mr: 2,
            mt: 2.5,
            borderColor: color ? "none" : "gray",
            borderStyle: color ? "none" : "dashed",
          }}
          setColorPickerMenuOpenAnchorEl={setColorPickerMenuOpenAnchorEl}
          categoryColor={color ? color.palette : emptyColor.palette}
        />
        <Stack direction={"column"} sx={{ maxWidth: "250px" }}>
          <TextField
            label={CREATE_NEW_CATEGORY_PLACEHOLDER_MSG}
            autoFocus
            required
            sx={{ mb: 2 }}
            size="small"
            variant="standard"
            onChange={handleCategoryNameFieldChange}
            value={categoryName}
          />
          <TextField
            label="Category description"
            placeholder={categoryDescriptionPlaceholder}
            sx={{
              mb: 1,
            }}
            multiline
            rows={2}
            size="small"
            variant="standard"
            onChange={handleCategoryDescriptionFieldChange}
            value={categoryDescription}
          />
        </Stack>
        <Stack
          direction={"row"}
          alignItems={"flex-start"}
          className={classes["hide-on-hover"]}
          sx={{ ml: 4 }}
        >
          <IconButton
            size="small"
            sx={(palette) => ({ color: palette.palette.primary.main })}
            onClick={() => removeNewCategory(id)}
          >
            <DeleteOutlineOutlinedIcon fontSize="inherit" />
          </IconButton>
        </Stack>
      </Stack>
      <Divider sx={{ mt: 1 }} />
      <ColorPickerMenu
        anchorEl={colorPickerMenuOpenAnchorEl}
        open={colorPickerMenuOpen}
        setColorPickerMenuOpenAnchorEl={setColorPickerMenuOpenAnchorEl}
        setCategoryColor={(color) => {
          setCategoryAttribute(id, "color", color);
        }}
        categoryColor={color}
      />
    </Box>
  );
};

interface CategoryEntryProps {
  category: Category;
  onRemoveCategory: (category: Category) => void;
}

const CategoryEntry = ({ category, onRemoveCategory }: CategoryEntryProps) => {
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
          <Typography variant={"caption"} sx={{ color: "grey" }}>
            {category.category_description ||
              "Lorem inpsum descriptsion descriptum il arbre"}
          </Typography>
        </Stack>
        <Stack
          direction={"row"}
          alignItems={"flex-start"}
          className={classes["hide-on-hover"]}
          sx={{ ml: 4 }}
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
            onClick={() => onRemoveCategory(category)}
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
  const dispatch = useAppDispatch();

  const categories = useAppSelector((state) => state.workspace.categories);

  const [newCategories, setNewCategories] = useState<
    {
      id: string;
      categoryName: string;
      categoryDescription: string;
      color: BadgeColor | undefined;
    }[]
  >([]);

  const { notify } = useNotification();

  const defaultColor = useMemo(
    () => ({
      name: "grey",
      palette: badgePalettes["grey"],
    }),
    []
  );

  const onCreateNewCategoryClick = useCallback(() => {
    setNewCategories([
      ...newCategories,
      {
        id: crypto.randomUUID(),
        categoryName: "",
        categoryDescription: "",
        color: undefined,
      },
    ]);
  }, [newCategories, setNewCategories]);

  const setCategoryAttribute = useCallback(
    (
      id: string,
      key: "categoryName" | "categoryDescription" | "color",
      newValue: any
    ) => {
      const changedCategory = newCategories.find((nc) => nc.id === id);
      const changedCategoryIndex = newCategories.findIndex(
        (nc) => nc.id === id
      );
      if (changedCategory) {
        changedCategory[key] = newValue;
        setNewCategories([
          ...newCategories.slice(0, changedCategoryIndex),
          changedCategory,
          ...newCategories.slice(changedCategoryIndex + 1),
        ]);
      }
    },
    [newCategories, setNewCategories]
  );

  const onRemoveNewCategory = useCallback(
    (id: string) => {
      setNewCategories([...newCategories.filter((nc) => nc.id !== id)]);
    },
    [newCategories, setNewCategories]
  );

  const onRemoveCategory = useCallback(
    (category: Category) => {
      dispatch(deleteCategory({ categoryId: category.category_id })).then(
        (action) => {
          if (isFulfilled(action)) {
            notify(`The category ${category.category_name} has been deleted`, {
              type: toast.TYPE.SUCCESS,
              autoClose: 5000,
              toastId: "category_deleted_toast",
            });
          }
        }
      );
    },
    [newCategories, setNewCategories]
  );

  const onClose = () => {
    setOpen(false);
  };

  const onSubmit = useCallback(() => {
    Promise.all(
      newCategories.map((nc) =>
        dispatch(
          createCategoryOnServer({
            categoryName: nc.categoryName,
            categoryDescription: nc.categoryDescription,
            categoryColor: nc.color || defaultColor,
          })
        )
      )
    ).then((actionResults) => {
      if (actionResults.every((actionResults) => isFulfilled(actionResults))) {
        setNewCategories([]);
        dispatch(checkStatus());
        notify(`The categories has been created`, {
          type: toast.TYPE.SUCCESS,
          autoClose: 5000,
          toastId: "category_created_toast",
        });
      }
    });
  }, [newCategories, setNewCategories]);

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
              onClick={onCreateNewCategoryClick}
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
      {categories.length || newCategories.length ? (
        <>
          <DialogContent
            sx={{
              p: 0,
              mx: 4,
              mt: 0,
              mb: 3,
              maxHeight: "40vh",
              minHeight: "40vh",
              overflowY: "scroll",
            }}
          >
            {newCategories.map((newCategory) => (
              <NewCategoryForm
                key={newCategory.id}
                categoryName={newCategory.categoryName}
                categoryDescription={newCategory.categoryDescription}
                color={newCategory.color}
                id={newCategory.id}
                setCategoryAttribute={setCategoryAttribute}
                removeNewCategory={onRemoveNewCategory}
              />
            ))}
            {categories.map((category) => (
              <CategoryEntry
                onRemoveCategory={onRemoveCategory}
                key={category.category_id}
                category={category}
              />
            ))}
          </DialogContent>
          <Stack
            direction="row"
            justifyContent="flex-end"
            alignItems="flex-end"
            sx={{
              m: 1,
              mt: 0,
            }}
          >
            <PrimaryButton
              onClick={onSubmit}
              sx={{
                ":hover": { background: "#0646c2" },
                ":disabled": {
                  background: "rgb(0 0 0 / 45%)",
                  color: "rgb(216, 212, 212)",
                },
              }}
              disabled={newCategories.length === 0}
            >
              Save changes
            </PrimaryButton>
          </Stack>
        </>
      ) : (
        <DialogContent sx={{ display: "flex", justifyContent: "center" }}>
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
