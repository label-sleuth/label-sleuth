import { useCallback, useEffect } from "react";
import { useAppSelector } from "./useRedux";
import { notify } from "../utils/notification";

export const useNotifyUploadedLabels = () => {
  const uploadedLabels = useAppSelector((state) => state.workspace.uploadedLabels);

  const getCategoriesString = useCallback((categories: string[]) => {
    if (categories.length === 1) return categories[0];
    else {
      let res = "";
      if (categories.length > 2) categories.slice(0, -2).forEach((c) => (res += `'${c}', `));
      res += `'${categories.slice(-2, -1)[0]}' and '${categories.slice(-1)[0]}'`;
      return res;
    }
  }, []);

  useEffect(() => {
    if (uploadedLabels) {
      const categoriesCreated = uploadedLabels.categoriesCreated;
      const createdCategoriesMessage = categoriesCreated.length
        ? `Added categories are: ${getCategoriesString(categoriesCreated)}`
        : "";
      notify(`New labels have been added! ${createdCategoriesMessage}`, {
        type: "success",
        toastId: "toast-uploaded-labels",
      });

      // if the user uploaded labels that were contradicting display a warning notification
      const contractictingLabelsElementCount = uploadedLabels.contracticting_labels_info.elements.length;
      if (contractictingLabelsElementCount > 0) {
        const warningMessage = `You uploaded contradicting labels for ${contractictingLabelsElementCount} element${
          contractictingLabelsElementCount > 1 ? "s" : ""
        }`;
        notify(warningMessage, { type: "warning", toastId: "toast-contractictingLabelsInfo" });
      }
    }
  }, [uploadedLabels, getCategoriesString]);
};
