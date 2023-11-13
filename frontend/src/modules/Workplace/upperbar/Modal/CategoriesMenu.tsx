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
  CATEGORY_NAME_MAX_CHARS,
  CREATE_NEW_CATEGORY_PLACEHOLDER_MSG,
  CustomizableUITextEnum,
  WRONG_INPUT_NAME_LENGTH,
} from "../../../../const";
import { useColorPicker } from "../../../../customHooks/useColorPicker";
import {
  ColorPickerButton,
  ColorPickerMenu,
} from "../../../../components/colorPicker/ColorPicker";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  badgePalettes,
  getCategoryFromId,
  getLeastUsedColors,
  onEnter,
  stringifyList,
} from "../../../../utils/utils";
import { PrimaryButton } from "../../../../components/dialog";
import {
  checkStatus,
  createCategory,
  deleteCategory,
  editCategory,
  nonDeletedCategoriesSelector,
  resetModelStatusCheckAttempts,
} from "../../redux";
import { isFulfilled } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { useNotification } from "../../../../utils/notification";
import React from "react";

interface NewOrEditCategoryFormProps {
  category: Category;
  setCategoryAttribute: (
    id: number,
    key: "category_name" | "category_description" | "color",
    newValue: any
  ) => void;
  removeNewCategory: (id: number) => void;
  isEditing: boolean;
  inCreationCategories: Category[];
  onRemoveCategory?: (category: Category) => void;
}

const NewOrEditCategoryForm = ({
  category,
  setCategoryAttribute,
  removeNewCategory,
  inCreationCategories,
  onRemoveCategory,
  isEditing,
}: NewOrEditCategoryFormProps) => {
  const {
    colorPickerMenuOpenAnchorEl,
    setColorPickerMenuOpenAnchorEl,
    colorPickerMenuOpen,
  } = useColorPicker();

  const [categoryNameError, setCategoryNameError] = React.useState("");

  const [inDeleteConfirmationStep, setInDeleteConfirmationStep] =
    useState(false);

  const categoryDescriptionPlaceholder = useAppSelector(
    (state) =>
      state.customizableUIText.texts[
        CustomizableUITextEnum.CATEGORY_DESCRIPTION_PLACEHOLDER
      ]
  );

  const nonDeletedCategories = useAppSelector(nonDeletedCategoriesSelector);

  const inCreationCategoriesColorNames = useMemo(() => {
    return inCreationCategories.map((c) => c.color?.name);
  }, [inCreationCategories]);

  const nonDeletedCategoriesColorNames = useMemo(() => {
    return nonDeletedCategories.map((c) => c.color?.name);
  }, [nonDeletedCategories]);

  const defaultColor: BadgeColor = useMemo(
    () => {
      const leastUsedColors = getLeastUsedColors(
        [...inCreationCategoriesColorNames, ...nonDeletedCategoriesColorNames]
          // tsc is not understanding that I am filtering undefined values
          // (which BTW can happen only in Binary mode) so I am casting
          .filter((c) => c !== undefined) as string[]
      );
      return leastUsedColors[0];
    },
    // eslint-disable-next-line
    [
      //using this ugly hack because js compares arrays by reference
      // and I don't know which is the correct way to proceed :(
      // eslint-disable-next-line
      JSON.stringify(inCreationCategoriesColorNames),
      // eslint-disable-next-line
      JSON.stringify(nonDeletedCategoriesColorNames),
    ]
  );

  useEffect(() => {
    if (!category.color) {
      setCategoryAttribute(category.category_id, "color", defaultColor);
    }
  }, [
    category.color,
    category.category_id,
    defaultColor,
    setCategoryAttribute,
  ]);

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
    setCategoryAttribute(category.category_id, "category_name", text);
  };

  const handleCategoryDescriptionFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    e.preventDefault();
    let text = e.target.value;
    setCategoryAttribute(category.category_id, "category_description", text);
  };

  return (
    <Box
      sx={{
        mb: 1,
        pt: 1.5,
      }}
      // only used for hiding the buttons when
      // the category entry is not hovered
      className={classes["category-entry"]}
    >
      <Stack
        direction={"row"}
        justifyContent="space-between"
        alignItems={"flex-start"}
      >
        <Stack direction={"row"}>
          <ColorPickerButton
            sx={{
              mr: 2,
              mt: 2.5,
            }}
            setColorPickerMenuOpenAnchorEl={setColorPickerMenuOpenAnchorEl}
            categoryColor={
              category.color ? category.color.palette : defaultColor.palette
            }
          />
          <Stack
            direction={"column"}
            sx={{
              width: inDeleteConfirmationStep ? "350px" : "400px",
            }}
          >
            <TextField
              label={CREATE_NEW_CATEGORY_PLACEHOLDER_MSG}
              autoFocus
              required
              sx={{ mb: 2 }}
              size="small"
              variant="standard"
              onChange={handleCategoryNameFieldChange}
              value={category.category_name}
              error={categoryNameError ? true : false}
              onKeyDown={(e) => {
                e.stopPropagation();
              }}
            />
            <p className={classes["error"]}>{categoryNameError}</p>
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
              value={category.category_description}
              onKeyDown={(e) => {
                e.stopPropagation();
              }}
            />
          </Stack>
        </Stack>
        {!inDeleteConfirmationStep ? (
          <Stack direction={"row"} className={classes["hide-on-not-hover"]}>
            <IconButton
              size="small"
              sx={(palette) => ({ color: palette.palette.primary.main })}
              onClick={() =>
                isEditing
                  ? setInDeleteConfirmationStep(true)
                  : removeNewCategory(category.category_id)
              }
            >
              <DeleteOutlineOutlinedIcon fontSize="inherit" />
            </IconButton>
          </Stack>
        ) : (
          <Stack direction="row">
            <Button
              onClick={() => onRemoveCategory && onRemoveCategory(category)}
              color="error"
            >
              {"Delete"}
            </Button>
            <Button
              sx={{ alignItems: "flex-start" }}
              onClick={() => setInDeleteConfirmationStep(false)}
            >
              {"Cancel"}
            </Button>
          </Stack>
        )}
      </Stack>
      <Divider sx={{ mt: 1 }} />
      <ColorPickerMenu
        anchorEl={colorPickerMenuOpenAnchorEl}
        open={colorPickerMenuOpen}
        setColorPickerMenuOpenAnchorEl={setColorPickerMenuOpenAnchorEl}
        setCategoryColor={(color) => {
          setCategoryAttribute(category.category_id, "color", color);
        }}
        categoryColor={category.color}
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
      // only used for hiding the buttons when
      // the category entry is not hovered
      className={classes["category-entry"]}
    >
      <Stack
        direction={"row"}
        justifyContent="space-between"
        alignItems={"flex-start"}
      >
        <Stack direction={"row"}>
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
          <Stack
            direction={"column"}
            sx={{
              width: inDeleteConfirmationStep ? "350px" : "400px",
            }}
          >
            <Typography
              sx={{
                mt: "-5px",
                overflow: "hidden",
                whiteSpace: "normal",
                textOverflow: "ellipsis",
                wordWrap: "break-word",
              }}
            >
              {category.category_name}
            </Typography>
            <Typography
              variant={"caption"}
              sx={{
                color: "grey",
                overflow: "hidden",
                whiteSpace: "normal",
                textOverflow: "ellipsis",
                wordWrap: "break-word",
              }}
            >
              {category.category_description || "No description"}
            </Typography>
          </Stack>
        </Stack>
        {!inDeleteConfirmationStep ? (
          <Stack direction={"row"} className={classes["hide-on-not-hover"]}>
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
        ) : (
          <Stack direction="row">
            <Button onClick={() => onRemoveCategory(category)} color="error">
              {"Delete"}
            </Button>
            <Button
              sx={{ alignItems: "flex-start" }}
              onClick={() => setInDeleteConfirmationStep(false)}
            >
              {"Cancel"}
            </Button>
          </Stack>
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

  const [newCategories, setNewCategories] = useState<Category[]>([]);

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
        category_id: newCategories.length
          ? Math.max(...newCategories.map((nc) => nc.category_id)) + 1
          : 1,
        category_name: "",
        category_description: "",
        color: undefined,
      },
    ]);
  }, [newCategories, setNewCategories]);

  const setCategoryAttribute = useCallback(
    (
        categories: Category[],
        setCategories: Dispatch<SetStateAction<Category[]>>
      ) =>
      (
        id: number,
        key: "category_name" | "category_description" | "color",
        newValue: any
      ) => {
        const changedCategory = categories.find(
          // eslint-disable-next-line
          (c) => c.category_id == id
        );
        const changedCategoryIndex = categories.findIndex(
          (nc) => nc.category_id === id
        );
        if (changedCategory) {
          changedCategory[key] = newValue;
          setCategories([
            ...categories.slice(0, changedCategoryIndex),
            changedCategory,
            ...categories.slice(changedCategoryIndex + 1),
          ]);
        }
      },
    []
  );

  const onRemoveNewCategory = useCallback(
    (id: number) => {
      setNewCategories([
        ...newCategories.filter((nc) => nc.category_id !== id),
      ]);
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

  const saveChangesEnabled = useMemo(() => {
    return (
      (newCategories.length > 0 || editedCategories.length > 0) &&
      !newCategories.some((c) => c.category_name === "") &&
      !editedCategories.some((c) => c.category_name === "")
    );
  }, [newCategories, editedCategories]);

  const onSubmit = useCallback(() => {
    if (saveChangesEnabled) {
      Promise.all(
        newCategories.map((nc) =>
          dispatch(
            createCategory({
              categoryName: nc.category_name,
              categoryDescription: nc.category_description,
              categoryColor: nc.color || greyColor,
            })
          )
        )
      ).then((actionResults) => {
        if (
          actionResults.length > 0 &&
          actionResults.every((actionResults) => isFulfilled(actionResults))
        ) {
          dispatch(resetModelStatusCheckAttempts());
          notify(
            `The ${
              newCategories.length > 1 ? "categories" : "category"
            } ${stringifyList(newCategories.map((nc) => nc.category_name))} ${
              newCategories.length > 1 ? "have" : "has"
            } been created`,
            {
              type: toast.TYPE.SUCCESS,
              autoClose: 5000,
              toastId: "category_created_toast",
            }
          );
          setNewCategories([]);
          dispatch(checkStatus());
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
          dispatch(resetModelStatusCheckAttempts());
          notify(
            `The ${
              editedCategories.length > 1 ? "categories" : "category"
            } ${stringifyList(
              editedCategories.map((ec) => ec.category_name)
            )} ${editedCategories.length > 1 ? "have" : "has"} been edited`,
            {
              type: toast.TYPE.SUCCESS,
              autoClose: 5000,
              toastId: "category_edited_toast",
            }
          );
          setEditedCategories([]);
          dispatch(checkStatus());
        }
        onClose();
      });
    }
  }, [
    newCategories,
    setNewCategories,
    greyColor,
    editedCategories,
    dispatch,
    notify,
    onClose,
    saveChangesEnabled,
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
      maxWidth={
        nonDeletedCategories.length || newCategories.length ? "sm" : "xs"
      }
      scroll={"body"}
      onKeyDown={(e) => onEnter(e, onSubmit)}
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
                <NewOrEditCategoryForm
                  key={category.category_id}
                  category={getCategoryFromId(
                    category.category_id,
                    editedCategories
                  )}
                  setCategoryAttribute={setCategoryAttribute(
                    editedCategories,
                    setEditedCategories
                  )}
                  removeNewCategory={onRemoveNewCategory}
                  isEditing={true}
                  inCreationCategories={[]}
                  onRemoveCategory={onRemoveCategory}
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
              <NewOrEditCategoryForm
                key={newCategory.category_id}
                category={newCategory}
                setCategoryAttribute={setCategoryAttribute(
                  newCategories,
                  setNewCategories
                )}
                removeNewCategory={onRemoveNewCategory}
                isEditing={false}
                inCreationCategories={newCategories}
                onRemoveCategory={onRemoveCategory}
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
              disabled={!saveChangesEnabled}
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
