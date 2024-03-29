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
  Tooltip,
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
import UndoIcon from "@mui/icons-material/Undo";
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
  onRemoveInEditionCategory?: (category: Category) => void;
}

const NewOrEditCategoryForm = ({
  category,
  setCategoryAttribute,
  removeNewCategory,
  inCreationCategories,
  onRemoveInEditionCategory,
  isEditing,
}: NewOrEditCategoryFormProps) => {
  const {
    colorPickerMenuOpenAnchorEl,
    setColorPickerMenuOpenAnchorEl,
    colorPickerMenuOpen,
  } = useColorPicker();

  const [categoryNameError, setCategoryNameError] = React.useState("");

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
              width: "350px",
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

        <Stack direction={"row"} className={classes["hide-on-not-hover"]}>
          <IconButton
            size="small"
            sx={(palette) => ({ color: palette.palette.primary.main })}
            onClick={() =>
              isEditing
                ? // onRemoveInEditionCategory is undefined for new category entries
                  onRemoveInEditionCategory &&
                  onRemoveInEditionCategory(category)
                : removeNewCategory(category.category_id)
            }
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
  isDeleted: boolean;
  onUndoCategoryDeletion: (category: Category) => void;
}

const CategoryEntry = ({
  category,
  onRemoveCategory,
  setCategoryEdited,
  isDeleted,
  onUndoCategoryDeletion,
}: CategoryEntryProps) => {
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
        sx={isDeleted ? { color: "gray" } : {}}
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
              width: "350px",
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
            {isDeleted && (
              <Typography
                color={"error"}
                variant={"subtitle2"}
                fontStyle={"italic"}
              >
                {"Deleted"}
              </Typography>
            )}
          </Stack>
        </Stack>
        {!isDeleted ? (
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
              onClick={() => onRemoveCategory(category)}
            >
              <DeleteOutlineOutlinedIcon fontSize="inherit" />
            </IconButton>
          </Stack>
        ) : (
          <Tooltip title={"Undo deletion"}>
            <IconButton
              onClick={() => onUndoCategoryDeletion(category)}
              size="small"
              sx={(palette) => ({ color: palette.palette.primary.main })}
              className={classes["hide-on-not-hover"]}
            >
              <UndoIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
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

  const modelVersion = useAppSelector((state) => state.workspace.modelVersion);

  const nonDeletedCategories = useAppSelector(nonDeletedCategoriesSelector);

  const [newCategories, setNewCategories] = useState<Category[]>([]);

  const [editedCategories, setEditedCategories] = useState<Category[]>([]);

  const [deletedCategories, setDeletedCategories] = useState<Category[]>([]);

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
      setDeletedCategories([...deletedCategories, structuredClone(category)]);
    },
    [deletedCategories, setDeletedCategories]
  );
  const undoCategoryEdition = useCallback(
    (category: Category) => {
      setEditedCategories(
        editedCategories.filter((c) => c.category_id != category.category_id)
      );
    },
    [editedCategories]
  );

  const onRemoveInEditionCategory = useCallback(
    (category: Category) => {
      onRemoveCategory(category);
      undoCategoryEdition(category);
    },
    [onRemoveCategory, undoCategoryEdition]
  );

  const onUndoCategoryDeletion = useCallback(
    (category: Category) =>
      setDeletedCategories(
        deletedCategories.filter((c) => c.category_id != category.category_id)
      ),
    [deletedCategories]
  );

  const onClose = useCallback(() => {
    setEditedCategories([]);
    setNewCategories([]);
    setDeletedCategories([]);
    setOpen(false);
  }, [setEditedCategories, setNewCategories, setOpen]);

  const didCategoryChange = useCallback(
    (c: Category) => {
      const editedCategoryUnchaged = nonDeletedCategories.find(
        (ndc) => ndc.category_id == c.category_id
      ) as Category;
      return (
        c.category_name !== editedCategoryUnchaged.category_name ||
        c.category_description !==
          editedCategoryUnchaged.category_description ||
        c.color?.name !== editedCategoryUnchaged.color?.name
      );
    },
    [nonDeletedCategories]
  );

  const saveChangesEnabled = useMemo(() => {
    return (
      (newCategories.length > 0 ||
        editedCategories.length > 0 ||
        deletedCategories.length > 0) &&
      !newCategories.some((c) => c.category_name === "") &&
      !editedCategories.some((c) => c.category_name === "") &&
      // check that that all the edited categories changed 
      // either its name, description or color
      (editedCategories.length === 0 ||
        editedCategories.every((c) => didCategoryChange(c)))
    );
  }, [newCategories, editedCategories, didCategoryChange, deletedCategories]);

  const onSubmit = useCallback(() => {
    // TODO: when there are two errors on submit only one is show, ie two category conflicts
    if (saveChangesEnabled) {

      const notifyChanges = (
        changedCategories: Category[],
        actionPerformed: string
      ) => {
        notify(
          `The ${
            changedCategories.length > 1 ? "categories" : "category"
          } ${stringifyList(changedCategories.map((nc) => nc.category_name))} ${
            changedCategories.length > 1 ? "have" : "has"
          } been ${actionPerformed}`,
          {
            type: toast.TYPE.SUCCESS,
            autoClose: 5000,
            toastId: `category_${actionPerformed}_toast`,
          }
        );
      };

      Promise.all([
        ...newCategories.map((nc) =>
          dispatch(
            createCategory({
              categoryName: nc.category_name,
              categoryDescription: nc.category_description,
              categoryColor: nc.color || greyColor,
            })
          )
        ),
        ...editedCategories.map((c) =>
          dispatch(
            editCategory({
              newCategoryName: c.category_name,
              newCategoryDescription: c.category_description,
              newCategoryColor: c.color || greyColor,
              categoryId: c.category_id,
            })
          )
        ),
        ...deletedCategories.map((c) =>
          dispatch(deleteCategory({ categoryId: c.category_id }))
        ),
      ]).then((actionResults) => {
        dispatch(resetModelStatusCheckAttempts());

        // only notify category changes that didn't fail
        const okCreations = newCategories.filter((c, i) =>
          isFulfilled(actionResults[i])
        );

        const okEdits = editedCategories.filter((c, i) =>
          isFulfilled(actionResults[newCategories.length + i])
        );

        const okDeletions = deletedCategories.filter((c, i) =>
          isFulfilled(
            actionResults[
              newCategories.length + editedCategories.length + i
            ]
          )
        );

        okCreations.length && notifyChanges(okCreations, "created");
        okEdits.length && notifyChanges(okEdits, "edited");
        okDeletions.length && notifyChanges(okDeletions, "deleted");

        setNewCategories([]);
        setEditedCategories([]);
        setDeletedCategories([]);

        dispatch(checkStatus());
      });
      onClose();
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
    didCategoryChange,
    deletedCategories,
  ]);

  const setCategoryEdited = useCallback(
    (category: Category) => {
      // structuredClone is used to avoid having a reference to the category object
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
                  onRemoveInEditionCategory={onRemoveInEditionCategory}
                />
              ) : (
                <CategoryEntry
                  onRemoveCategory={onRemoveCategory}
                  key={category.category_id}
                  category={category}
                  setCategoryEdited={setCategoryEdited}
                  isDeleted={
                    deletedCategories.filter(
                      (dc) => category.category_id == dc.category_id
                    ).length === 1
                  }
                  onUndoCategoryDeletion={onUndoCategoryDeletion}
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
            {saveChangesEnabled &&
              modelVersion !== null &&
              modelVersion > 0 && (
                <Typography
                  variant="caption"
                  sx={{
                    position: "absolute",
                    ml: 4,
                    left: 0,
                    alignSelf: "center",
                    fontStyle: "italic",
                    fontSize: "0.9rem",
                  }}
                >
                  {"Note: Saving the changes may trigger a new iteration!"}
                </Typography>
              )}
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
