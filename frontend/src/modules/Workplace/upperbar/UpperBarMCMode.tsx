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
import Box from "@mui/material/Box";
import classes from "./UpperBar.module.css";
import { useAppSelector } from "../../../customHooks/useRedux";
import { IconButton, Stack, Typography } from "@mui/material";
import { AppBarLS, UpperBarProps } from ".";
import AddIcon from "@mui/icons-material/Add";
import { CreateCategoryModal } from "./Modal/CreateCategoryModal";
import ModeEditOutlineOutlinedIcon from "@mui/icons-material/ModeEditOutlineOutlined";
import { CategoriesMenu } from "./Modal/CategoriesMenu";

export const UpperBarMCMode = ({
  rightDrawerWidth,
  rightPanelOpen,
}: UpperBarProps) => {
  const curCategory = useAppSelector((state) => state.workspace.curCategory);
  const categories = useAppSelector((state) => state.workspace.categories);
  const modelVersion = useAppSelector((state) => state.workspace.modelVersion);
  const [cardOpen, setCardOpen] = React.useState(true);
  const [createCategoryModalOpen, setCreateCategoryModalOpen] = useState(false);
  const [createCategoryModalOpen2, setCreateCategoryModalOpen2] = useState(false);

  const handleAddCategory = () => {
    setCreateCategoryModalOpen(true);
  };

  const handleAddCategory2 = () => {
    setCreateCategoryModalOpen2(true);
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
      <Box className={classes["app-bar-container"]}>
        <Stack direction="row" alignItems={"center"}>
          <Typography variant="subtitle1">{`${categories.length} categories`}</Typography>
          <IconButton
            size="small"
            sx={(palette) => ({ color: palette.palette.primary.main, ml: 2 })}
            onClick={handleAddCategory}
            >
            <ModeEditOutlineOutlinedIcon fontSize="inherit" />
          </IconButton>
        </Stack>
        <CategoriesMenu
          open={createCategoryModalOpen}
          setOpen={setCreateCategoryModalOpen}
        />
      </Box>
    </AppBarLS>
  );
};
