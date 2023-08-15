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
import { CategoryBadge } from "../../../components/categoryBadge/CategoryBadge";
import { IconButton, Stack, Tooltip } from "@mui/material";
import { AppBarLS, UpperBarProps } from ".";
import AddIcon from "@mui/icons-material/Add";
import { CreateCategoryModal } from "./Modal/CreateCategoryModal";
import { getCategoryColorFromId } from "../../../utils/utils";

export const UpperBarMCMode = ({
  rightDrawerWidth,
  rightPanelOpen,
}: UpperBarProps) => {
  const curCategory = useAppSelector((state) => state.workspace.curCategory);
  const categories = useAppSelector((state) => state.workspace.categories);
  const modelVersion = useAppSelector((state) => state.workspace.modelVersion);
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
      <Box className={classes["app-bar-container"]}>
        <p className={classes["dropdown-label"]}>Categories: </p>
        <Stack direction="row" alignItems={"center"}>
          {categories.map((c, i) => (
            <Box sx={{ pr: 1 }} key={i}>
              <CategoryBadge
                categoryName={c.category_name}
                color={getCategoryColorFromId(c.category_id, categories) || undefined}
              />
            </Box>
          ))}
          <Tooltip
            title={
              modelVersion !== null && modelVersion > 0
                ? "Adding categories after a model is trained is not yet supported"
                : "Add a category"
            }
          >
            <span>
              <IconButton
                sx={{}}
                aria-label="add category"
                size="medium"
                onClick={handleAddCategory}
                //adding categories after a model is trained is not yet supported
                disabled={modelVersion !== null && modelVersion > 0}
              >
                <AddIcon fontSize="medium" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
        <CreateCategoryModal
          open={createCategoryModalOpen}
          setOpen={setCreateCategoryModalOpen}
        />
      </Box>
    </AppBarLS>
  );
};
