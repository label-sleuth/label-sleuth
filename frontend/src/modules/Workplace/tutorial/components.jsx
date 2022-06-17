import { styled } from "@mui/material/styles";
import { Box, Button } from "@mui/material";

export const ModalContent = styled(Box)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 0px;
  gap: 5px;
  width: 824px;
  height: 324px;
  background: #161616;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

export const SmallTitle = styled("div")`
  width: 404px;
  height: 20px;
  font-family: "IBM Plex Sans";
  font-style: normal;
  font-weight: 300;
  font-size: 14px;
  line-height: 20px;
  color: rgba(255, 255, 255, 0.5);
`;

export const LargeTitle = styled("div")`
  height: 36px;
  font-family: "IBM Plex Sans";
  font-style: normal;
  font-weight: 600;
  font-size: 28px;
  line-height: 36px;
  color: #ffffff;
  margin-bottom: 15px;
`;

export const MainContent = styled("div")`
  width: 774px;
  height: 160px;
  font-family: "IBM Plex Sans";
  font-style: normal;
  font-weight: 300;
  font-size: 16px;
  line-height: 20px;
  color: #ffffff;
`;

export const NextButton = styled(Button)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 10px 18px;
  gap: 10px;
  width: 66px;
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

export const SkipButton = styled(Button)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 10px 18px;
  gap: 10px;
  width: 66px;
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
