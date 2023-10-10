import React from "react";
import { useAppSelector, useAppDispatch } from "../../../customHooks/useRedux";
import { useLocalStorage } from "usehooks-ts";
import { useNotification } from "../../../utils/notification";
import { FormControl, Typography } from "@mui/material";
import { Keyboard } from "../../../components/Keyboard";
import {
  ControlledSelect,
  DropdownOption,
} from "../../../components/dropdown/Dropdown";
import { toast } from "react-toastify";
import { updateCurCategory } from "../redux";

export const CategoryFormControl = () => {
  const curCategory = useAppSelector((state) => state.workspace.curCategory);
  const categories = useAppSelector((state) => state.workspace.categories);
  const dispatch = useAppDispatch();
  const [showShortcutsNotification, setShowShortcutsNotification] =
    useLocalStorage("showShortcutsNotification", true);
  const { notify } = useNotification();
  const options: DropdownOption[] = categories
    .map((item) => ({
      value: `${item.category_id}`,
      title: item.category_name,
      caption: item.category_description,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  const ShortcutsMessageComponent = () => (
    <Typography>
      Press <Keyboard kbd={"Shift"} /> + <Keyboard kbd={"?"} /> to see the
      available keyboard shortcuts
    </Typography>
  );

  React.useEffect(() => {
    if (curCategory !== null && showShortcutsNotification === true) {
      const toastId = "info-shortcuts";
      notify(<ShortcutsMessageComponent />, { toastId, type: toast.TYPE.INFO });
      setShowShortcutsNotification(false);
    }
  }, [
    notify,
    curCategory,
    showShortcutsNotification,
    setShowShortcutsNotification,
  ]);

  const handleCategorySelect = (value: string) => {
    dispatch(updateCurCategory(Number(value)));
  };

  return (
    <FormControl variant="standard">
      <ControlledSelect
        value={curCategory !== null ? `${curCategory}` : ""}
        onChange={handleCategorySelect}
        options={options}
        placeholder={"Choose a category"}
        noOptionsPlaceholder={"No categories created"}
        aria="category-select"
        label=""
        itemHeightCount={null}
        itemMinWidth="500px"
        itemTextSx={{ fontWeight: 450 }}
        sx={{ minWidth: "200px" }}
      />
    </FormControl>
  );
};
