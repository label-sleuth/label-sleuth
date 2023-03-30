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

import { Card, CardContent, Typography, IconButton, Stack } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useAppSelector } from "../../../customHooks/useRedux";
import classes from "./UpperBar.module.css";

interface CategoryCardProps {
  setCardOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const CategoryCard = ({ setCardOpen }: CategoryCardProps) => {
  const categories = useAppSelector((state) => state.workspace.categories);

  return (
    <Stack direction={"row"} alignItems={"center"}>
      <div className={classes["arrow-left"]}></div>
      <Card className={classes["category-card"]}>
        <CardContent sx={{ padding: "0px 10px 10px 10px" }}>
          <Typography sx={{ lineHeight: "1.1" }} variant="caption" color="text.secondary">
            {categories.length === 0
              ? "Please create your first category"
              : "Please select a category or create a new one"}
          </Typography>
          <IconButton aria-label="close" style={{ fontSize: "1rem" }} onClick={() => setCardOpen(false)}>
            <CloseIcon fontSize="inherit" />
          </IconButton>
        </CardContent>
      </Card>
    </Stack>
  );
};
