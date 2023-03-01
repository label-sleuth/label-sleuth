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

import { styled } from "@mui/material/styles";
import { Box, Button, Modal } from "@mui/material";

export const OuterModal = styled(Modal)`
    z-index: 10001;
    background-color: rgba(0, 0, 0, 0.1);
  }`;

export const InnerModal = styled(Modal)`
  z-index: 10002;
`;

export const InnerModalContent = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  padding: "0px",
  gap: "5px",
  minHeight: "324px",
  background: "#161616",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  [theme.breakpoints.up("sm")]: {
    width: "60%",
  },
  [theme.breakpoints.up("md")]: {
    width: "55%",
  },
  [theme.breakpoints.up("lg")]: {
    width: "45%",
  },
  [theme.breakpoints.up("xl")]: {
    width: "35%",
  },
}));

export const OuterModalContent = styled(Box)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
`;

export const SmallTitle = styled("div")`
  font-family: "IBM Plex Sans";
  font-style: normal;
  font-weight: 300;
  font-size: 14px;
  line-height: 20px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: -20px;
`;

export const LargeTitle = styled("div")`
  font-family: "IBM Plex Sans";
  font-style: normal;
  font-weight: 600;
  font-size: 28px;
  line-height: 36px;
  color: #ffffff;
  margin-bottom: 15px;
`;

export const StageCounter = styled("div")`
  font-family: "IBM Plex Sans";
  font-style: normal;
  font-weight: 300;
  font-size: 28px;
  line-height: 36px;
  color: #ffffff;
  margin-bottom: 15px;
  margin-left: 10px;
  margin-right: 25px;
  white-space: nowrap;
`;

export const MainContent = styled("div")`
  font-family: "IBM Plex Sans";
  font-style: normal;
  font-weight: 400;
  font-size: 18px;
  line-height: 25px;
  color: #ffffff;
  text-align: justify;
  margin-right: 25px;
`;

// TODO: PrimaryButton is not acception component="label" prop, setting it to any meanwhile
export const PrimaryButton: any = styled(Button)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 10px 18px;
  gap: 10px;
  height: 38px;
  background: #0f61fe;
  border-radius: 0;
  border: none;
  font-family: "IBM Plex Sans";
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  color: #ffffff;
  text-transform: none;
`;

export const SecondaryButton = styled(Button)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 10px 18px;
  gap: 10px;
  height: 38px;
  background: inherit;
  border-radius: 0;
  border: none;
  font-family: "IBM Plex Sans";
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: none;
`;
