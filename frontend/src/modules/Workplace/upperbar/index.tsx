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

import { FC } from "react";
import { ACTIONS_DRAWER_WIDTH, APPBAR_HEIGHT, LEFT_DRAWER_WIDTH } from "../../../const";
import { useAppSelector } from "../../../customHooks/useRedux";
import { returnByMode } from "../../../utils/utils";
import { UpperBarMCMode } from "./UpperBarMCMode";
import { UpperBarBMode } from "./UpperBarBMode";
import { Box, styled } from "@mui/material";



// the AppBar component from mui isn't used because it's width doens't get updated when resizing the right sidebar
export const AppBarLS = styled(Box)(
  ({ rightDrawerWidth, rightPanelOpen }: UpperBarProps) => ({
    position: "fixed",
    top: 0,
    left: LEFT_DRAWER_WIDTH,
    right: ACTIONS_DRAWER_WIDTH,
    height: APPBAR_HEIGHT,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#f4f4f4",
    borderBottom: "solid 1px #d6d6d6",
    padding: "0 25px",
    ...(rightPanelOpen && {
      marginRight: rightDrawerWidth,
    }),
  })
);

export interface UpperBarProps {
  rightDrawerWidth: number;
  rightPanelOpen: boolean;
}

export const UpperBar: FC<UpperBarProps> = (props) => {
  const mode = useAppSelector((state) => state.workspace.mode);
  return returnByMode(
    <UpperBarBMode {...props} />,
    <UpperBarMCMode {...props} />,
    mode
  );
};
