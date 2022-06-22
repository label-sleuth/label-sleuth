import { styled } from "@mui/material/styles";
import { Box, Button, Modal } from "@mui/material";
import img1 from './assets/v1/stage_1.png'
import img2 from './assets/v1/stage_2.png'
import img3 from './assets/v1/stage_3.png'
import img4 from './assets/v1/stage_4.png'
import img5 from './assets/v1/stage_5.png'
import img6 from './assets/v1/stage_6.png'
import img7 from './assets/v1/stage_7.png'

const images = [ img1, img2, img3, img4, img5, img6, img7]

export const getTutorialModal = (stageIndex) => {
  return styled(Modal)`
    z-index: 10001;
    & .MuiBackdrop-root {
      background-image: url(${images[stageIndex]});
      background-repeat:no-repeat;
      background-size:100% 100%;
    }
`;
}


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

export const PrimaryButton = styled(Button)`
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
