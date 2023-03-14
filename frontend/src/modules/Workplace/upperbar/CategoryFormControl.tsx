import React from "react";
import { useAppSelector, useAppDispatch } from "../../../customHooks/useRedux";
import { useLocalStorage } from "usehooks-ts";
import { useNotification } from "../../../utils/notification";
import { FormControl, Typography } from "@mui/material";
import { Keyboard } from "../../../components/Keyboard";
import ControlledSelect from "../../../components/dropdown/Dropdown";
import { toast } from "react-toastify";
import { updateCurCategory } from "../redux";

export const CategoryFormControl = () => {
  const curCategory = useAppSelector((state) => state.workspace.curCategory);
  const categories = useAppSelector((state) => state.workspace.categories);
  const dispatch = useAppDispatch();
  const [showShortcutsNotification, setShowShortcutsNotification] = useLocalStorage("showShortcutsNotification", true);
  const { notify } = useNotification();

  const options = categories
    .map((item) => ({ value: `${item.category_id}`, label: item.category_name }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const ShortcutsMessageComponent = () => (
    <Typography>
      Press <Keyboard kbd={"Shift"} /> + <Keyboard kbd={"?"} /> to see the available keyboard shortcuts
    </Typography>
  );

  React.useEffect(() => {
    if (curCategory !== null && showShortcutsNotification === true) {
      const toastId = "info-shortcuts";
      notify(<ShortcutsMessageComponent />, { toastId, type: toast.TYPE.INFO });
      setShowShortcutsNotification(false);
    }
  }, [notify, curCategory, showShortcutsNotification, setShowShortcutsNotification]);

  const handleCategorySelect = (value: string) => {
    dispatch(updateCurCategory(Number(value)));
  };

  return (
    <FormControl variant="standard" sx={{ minWidth: "200px", marginBottom: "16px" }}>
      <ControlledSelect
        value={curCategory !== null ? `${curCategory}` : ""}
        onChange={handleCategorySelect}
        options={options}
        placeholder={"Choose a category" }
        noOptionsPlaceholder={"No categories available"}
        aria="category-select"
        label=""
      />
    </FormControl>
  );
};
