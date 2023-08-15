import { FC } from "react";
import { useAppSelector } from "../../customHooks/useRedux";
import { returnByMode } from "../../utils/utils";
import { MainElementMCMode } from "./MainElementMCMode";
import { MainElementBMode } from "./MainElementBMode";
import { Element } from "../../global";
import { Box, Tooltip } from "@mui/material";
import sleuthLogo from "../../assets/sleuth_blue.svg";

export const PosPredIndicator = () => {
  const radius = 20;
  const border = 2;
  return (
    <Tooltip title="Positive prediction" placement="top">
      <Box
        sx={{
          borderColor: "white",
          borderWidth: "2px",
          borderStyle: "solid",
          borderRadius: "100px",
          height: `${radius + border * 2}px`,
        }}
      >
        <img
          style={{
            opacity: 1,
            width: `${radius}px`,
            height: `${radius}px`,
            margin: 0,
            padding: 0,
          }}
          src={sleuthLogo}
          alt="Positive prediction icon"
        />
      </Box>
    </Tooltip>
  );
};
export interface ElementProps {
  element: Element;
}

export const MainElement: FC<ElementProps> = (props) => {
  const mode = useAppSelector((state) => state.workspace.mode);

  return returnByMode(
    <MainElementBMode {...props} />,
    <MainElementMCMode {...props} />,
    mode
  );
};
