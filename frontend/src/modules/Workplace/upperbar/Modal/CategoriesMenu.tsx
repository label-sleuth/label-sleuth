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
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { badgePalettes } from "../../../../utils/utils";
import { PrimaryButton } from "../../../../components/dialog";
import {
  checkStatus,
  createCategory,
  deleteCategory,
  editCategory,
  nonDeletedCategoriesSelector,
} from "../../redux";
import { isFulfilled } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { useNotification } from "../../../../utils/notification";

interface NewCategoryFormProps {
  categoryName: string;
  categoryDescription: string;
  color: BadgeColor | undefined;
  id: string;
  setCategoryAttribute: (id: string, key: string, newValue: any) => void;
  removeNewCategory: (id: string) => void;
  isEditing: boolean;
  inCreationCategories?: {
    id: string;
    categoryName: string;
    categoryDescription: string;
    color: BadgeColor | undefined;
  }[];
}

const NewCategoryForm = ({
  categoryName,
  categoryDescription,
  color,
  id,
  setCategoryAttribute,
  removeNewCategory,
  isEditing = false,
  inCreationCategories,
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

  const nonDeletedCategories = useAppSelector(nonDeletedCategoriesSelector);

  const greyColor = useMemo(
    () => ({
      name: "grey",
      palette: badgePalettes["grey"],
    }),
    []
  );

  const defaultColor: BadgeColor = useMemo(() => {
    const usedColors = new Set<string>();
    nonDeletedCategories.forEach(
      (c) => c.color && usedColors.add(c.color.name)
    );
    inCreationCategories?.forEach(
      (c) => c.color && usedColors.add(c.color.name)
    );
    const unusedColors = new Set<string>();
    Object.keys(badgePalettes).forEach(
      (k) => !!!usedColors.has(k) && unusedColors.add(k)
    );
    unusedColors.delete("white");
    if (unusedColors.size > 0) {
      const colorName = Array.from(unusedColors)[0];
      return {
        name: colorName,
        palette: badgePalettes[colorName],
      };
    } else {
      return greyColor;
    }
  }, [nonDeletedCategories, greyColor, inCreationCategories]);

  useEffect(() => {
    if (!color) {
      setCategoryAttribute(id, "color", defaultColor);
    }
  }, [color, defaultColor, id, setCategoryAttribute]);

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
    setCategoryAttribute(
      id,
      isEditing ? "category_name" : "categoryName",
      text
    );
  };

  const handleCategoryDescriptionFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    e.preventDefault();
    let text = e.target.value;
    setCategoryAttribute(
      id,
      isEditing ? "category_description" : "categoryDescription",
      text
    );
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
          }}
          setColorPickerMenuOpenAnchorEl={setColorPickerMenuOpenAnchorEl}
          categoryColor={color ? color.palette : defaultColor.palette}
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
        {!!!isEditing && (
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
        )}
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
  setCategoryEdited: (category: Category) => void;
}

const CategoryEntry = ({
  category,
  onRemoveCategory,
  setCategoryEdited,
}: CategoryEntryProps) => {
  const [inDeleteConfirmationStep, setInDeleteConfirmationStep] =
    useState(false);

  return (
    <Box
      sx={{
        mb: 1,
        pt: 1.5,
      }}
      className={classes["category-entry"]}
    >
      <Stack direction={"row"}>
        <Stack
          direction={"row"}
        >
          <Box
            sx={{
              width: "25px",
              height: "25px",
              float: "left",
              borderRadius: "8px",
              backgroundColor: category.color?.palette[300],
              mr: 2,
            }}
          />
          <Stack direction={"column"} sx={{ width: "250px" }}>
            <Typography sx={{ mt: "-5px" }}>
              {category.category_name}
            </Typography>
            <Typography variant={"caption"} sx={{ color: "grey" }}>
              {category.category_description || "No description"}
            </Typography>
          </Stack>
          {!inDeleteConfirmationStep && (
            <Stack
              direction={"row"}
              alignItems={"flex-start"}
              className={classes["hide-on-hover"]}
              sx={{ ml: 3 }}
            >
              <IconButton
                onClick={() => setCategoryEdited(category)}
                size="small"
                sx={(palette) => ({ color: palette.palette.primary.main })}
              >
                <ModeEditOutlineOutlinedIcon fontSize="inherit" />
              </IconButton>
              <IconButton
                size="small"
                sx={(palette) => ({ color: palette.palette.primary.main })}
                onClick={() => setInDeleteConfirmationStep(true)}
              >
                <DeleteOutlineOutlinedIcon fontSize="inherit" />
              </IconButton>
            </Stack>
          )}
        </Stack>
        {inDeleteConfirmationStep && (
          <>
            <Button
              onClick={() => onRemoveCategory(category)}
              sx={{ ml: -5 }}
              color="error"
            >
              {"Delete"}
            </Button>
            <Button onClick={() => setInDeleteConfirmationStep(false)}>
              {"Cancel"}
            </Button>
          </>
        )}
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

  const nonDeletedCategories = useAppSelector(nonDeletedCategoriesSelector);

  const [newCategories, setNewCategories] = useState<
    {
      id: string;
      categoryName: string;
      categoryDescription: string;
      color: BadgeColor | undefined;
    }[]
  >([]);

  const [editedCategories, setEditedCategories] = useState<Category[]>([]);

  const { notify } = useNotification();

  const greyColor = useMemo(
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
        // id is just a number. To avoid problems with deleting categories that are being created
        // we just set the id as 1 + the maximum current id.
        id: newCategories.length
          ? (
              Math.max(...newCategories.map((nc) => parseInt(nc.id))) + 1
            ).toString()
          : "1",
        categoryName: "",
        categoryDescription: "",
        color: undefined,
      },
    ]);
  }, [newCategories, setNewCategories]);

  const setNewCategoryAttribute = useCallback(
    (id: string, key: string, newValue: any) => {
      const changedCategory = newCategories.find((nc) => nc.id === id);
      const changedCategoryIndex = newCategories.findIndex(
        (nc) => nc.id === id
      );
      if (changedCategory) {
        changedCategory[
          key as "categoryName" | "categoryDescription" | "color"
        ] = newValue;
        setNewCategories([
          ...newCategories.slice(0, changedCategoryIndex),
          changedCategory,
          ...newCategories.slice(changedCategoryIndex + 1),
        ]);
      }
    },
    [newCategories, setNewCategories]
  );

  const setCategoryAttribute = useCallback(
    (id: string, key: string, newValue: any) => {
      const changedCategory = editedCategories.find(
        // eslint-disable-next-line
        (c) => `${c.category_id}` == id
      );
      if (changedCategory) {
        changedCategory[
          key as "category_name" | "category_description" | "color"
        ] = newValue;
        setEditedCategories([
          // eslint-disable-next-line
          ...editedCategories.filter((ec) => `${ec.category_id}` != id),
          changedCategory,
        ]);
      }
    },
    [editedCategories, setEditedCategories]
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
    [dispatch, notify]
  );

  const onClose = useCallback(() => {
    setEditedCategories([]);
    setNewCategories([]);
    setOpen(false);
  }, [setEditedCategories, setNewCategories, setOpen]);

  const onSubmit = useCallback(() => {
    Promise.all(
      newCategories.map((nc) =>
        dispatch(
          createCategory({
            categoryName: nc.categoryName,
            categoryDescription: nc.categoryDescription,
            categoryColor: nc.color || greyColor,
          })
        )
      )
    ).then((actionResults) => {
      if (
        actionResults.length > 0 &&
        actionResults.every((actionResults) => isFulfilled(actionResults))
      ) {
        setNewCategories([]);
        dispatch(checkStatus());
        notify(`The categories has been created`, {
          type: toast.TYPE.SUCCESS,
          autoClose: 5000,
          toastId: "category_created_toast",
        });
      }
    });

    Promise.all(
      editedCategories.map((c) =>
        dispatch(
          editCategory({
            newCategoryName: c.category_name,
            newCategoryDescription: c.category_description,
            newCategoryColor: c.color || greyColor,
            categoryId: c.category_id,
          })
        )
      )
    ).then((actionResults) => {
      if (
        actionResults.length > 0 &&
        actionResults.every((actionResults) => isFulfilled(actionResults))
      ) {
        setEditedCategories([]);
        dispatch(checkStatus());
        notify(`The categories has been edited`, {
          type: toast.TYPE.SUCCESS,
          autoClose: 5000,
          toastId: "category_edited_toast",
        });
      }
      onClose();
    });
  }, [
    newCategories,
    setNewCategories,
    greyColor,
    editedCategories,
    dispatch,
    notify,
    onClose,
  ]);

  const setCategoryEdited = useCallback(
    (category: Category) => {
      setEditedCategories([...editedCategories, structuredClone(category)]);
    },
    [editedCategories, setEditedCategories]
  );
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="categories-menu"
      aria-describedby="Menu for creating, editing, deleting and viewing all the categories"
      disableRestoreFocus
      fullWidth
      maxWidth={"xs"}
      sx={{ overflowY: "scroll" }}
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
      {nonDeletedCategories.length || newCategories.length ? (
        <>
          <DialogContent
            sx={{
              p: 0,
              px: 2,
              mx: 2,
              mt: 0,
              mb: 3,
              maxHeight: "40vh",
              minHeight: "40vh",
            }}
          >
            {nonDeletedCategories.map((category) =>
              editedCategories.find(
                // eslint-disable-next-line
                (c) => c.category_id == category.category_id
              ) !== undefined ? (
                <NewCategoryForm
                  key={category.category_id}
                  categoryName={
                    (
                      editedCategories.find(
                        // eslint-disable-next-line
                        (c) => c.category_id == category.category_id
                      ) as Category
                    ).category_name
                  }
                  categoryDescription={
                    (
                      editedCategories.find(
                        // eslint-disable-next-line
                        (c) => c.category_id == category.category_id
                      ) as Category
                    ).category_description
                  }
                  color={
                    (
                      editedCategories.find(
                        // eslint-disable-next-line
                        (c) => c.category_id == category.category_id
                      ) as Category
                    ).color
                  }
                  id={`${category.category_id}`}
                  setCategoryAttribute={setCategoryAttribute}
                  removeNewCategory={onRemoveNewCategory}
                  isEditing={true}
                />
              ) : (
                <CategoryEntry
                  onRemoveCategory={onRemoveCategory}
                  key={category.category_id}
                  category={category}
                  setCategoryEdited={setCategoryEdited}
                />
              )
            )}
            {newCategories.map((newCategory) => (
              <NewCategoryForm
                key={newCategory.id}
                categoryName={newCategory.categoryName}
                categoryDescription={newCategory.categoryDescription}
                color={newCategory.color}
                id={newCategory.id}
                setCategoryAttribute={setNewCategoryAttribute}
                removeNewCategory={onRemoveNewCategory}
                isEditing={false}
                inCreationCategories={newCategories}
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
              disabled={
                newCategories.length === 0 && editedCategories.length === 0
              }
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
