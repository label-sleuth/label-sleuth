import { useAppSelector } from "../../../customHooks/useRedux";
import { returnByMode } from "../../../utils/utils";
import { LabelCountPanelBMode } from "./LabelCountPanelBMode";
import { LabelCountPanelMCMode } from "./LabelCountPanelMCMode";

export const LabelCountPanel = () => {
  const mode = useAppSelector((state) => state.workspace.mode);
  return returnByMode(
    <LabelCountPanelBMode />,
    <LabelCountPanelMCMode />,
    mode
  );
};
