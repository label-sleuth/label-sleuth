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

import React, { useState } from "react";
import { useAppSelector } from "../../../customHooks/useRedux";
import { IconButton, Stack, Typography } from "@mui/material";
import { AppBarLS, UpperBarProps } from ".";
import ModeEditOutlineOutlinedIcon from "@mui/icons-material/ModeEditOutlineOutlined";
import { CategoriesMenu } from "./Modal/CategoriesMenu";
import { nonDeletedCategoriesSelector } from "../redux";

export const UpperBarMCMode = ({
  rightDrawerWidth,
  rightPanelOpen,
}: UpperBarProps) => {
  const curCategory = useAppSelector((state) => state.workspace.curCategory);
  const nonDeletedCategories = useAppSelector(nonDeletedCategoriesSelector);
  const [cardOpen, setCardOpen] = React.useState(true);
  const [createCategoryModalOpen, setCreateCategoryModalOpen] = useState(false);

  const handleAddCategory = () => {
    setCreateCategoryModalOpen(true);
  };

  React.useEffect(() => {
    if (curCategory !== null && cardOpen) {
      setCardOpen(false);
    }
  }, [curCategory, cardOpen]);

  return (
    <AppBarLS
      rightDrawerWidth={rightDrawerWidth}
      rightPanelOpen={rightPanelOpen}
    >
      <Stack
        direction="row"
        justifyContent={"space-between"}
        alignItems={"center"}
        flexGrow={1}
      >
        <Typography variant="h6">{"Categories"}</Typography>
        <Stack direction="row" alignItems={"center"}>
          <Typography sx={{ flexGrow: 1 }} variant="subtitle1">
            {nonDeletedCategories.length > 0
              ? `${nonDeletedCategories.length} ${
                  nonDeletedCategories.length === 1 ? "category" : "categories"
                }`
              : "No categories created yet"}
          </Typography>
          <IconButton
            size="small"
            sx={(palette) => ({ color: palette.palette.primary.main, ml: 2 })}
            onClick={handleAddCategory}
          >
            <ModeEditOutlineOutlinedIcon fontSize="inherit" />
          </IconButton>
        </Stack>
      </Stack>
      <CategoriesMenu
        open={createCategoryModalOpen}
        setOpen={setCreateCategoryModalOpen}
      />
    </AppBarLS>
  );
};
