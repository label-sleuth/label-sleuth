import { BASE_URL } from "../config";
import { CustomizableUITextEnum } from "../const";
import { useAppSelector } from "./useRedux";

export const useAppLogoURL = () => {
  const appLogoPath = useAppSelector(
    (state) =>
      state.customizableUIText.texts[CustomizableUITextEnum.APP_LOGO_PATH]
  );

  return BASE_URL !== "" ? `${BASE_URL}/${appLogoPath}` : appLogoPath;
};
