import { FC } from "react";
import { useAppSelector } from "../../customHooks/useRedux";
import { returnByMode } from "../../utils/utils";
import { Element } from "../../global";
import { SxProps } from "@mui/material";
import { SidebarElementMCMode } from "./SidebarElementMCMode";
import { SidebarElementBMode } from "./SidebarElementBMode";

export interface SidebarElementProps {
  element: Element;
  updateCounterOnLabeling?: boolean;
  index: number;
  sx?: SxProps;
}

export const SidebarElement: FC<SidebarElementProps> = (props) => {
  const mode = useAppSelector((state) => state.workspace.mode);

  return returnByMode(
    <SidebarElementBMode {...props} />,
    <SidebarElementMCMode {...props} />,
    mode
  );
};
