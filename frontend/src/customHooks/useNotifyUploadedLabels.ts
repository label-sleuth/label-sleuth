import { useCallback, useEffect } from "react";
import { useAppSelector } from "./useRedux";
import { notify, updateToast } from "../utils/notification";
import React from "react";
import { UPLOAD_LABELS_WAIT_MESSAGE } from "../const";
import { toast } from "react-toastify";

export const useNotifyUploadedLabels = () => {
  const uploadedLabels = useAppSelector((state) => state.workspace.uploadedLabels);
  const uploadingLabels = useAppSelector((state) => state.workspace.uploadingLabels);
  const toastRef = React.useRef<React.ReactText | null>(null);

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
    if (uploadingLabels) {
      toastRef.current = notify(UPLOAD_LABELS_WAIT_MESSAGE, { type: toast.TYPE.INFO }, true);
    } else if (uploadedLabels !== null) {
      // if the user uploaded labels that were contradicting display a warning notification
      const contractictingLabelsElementCount = uploadedLabels.contracticting_labels_info.elements.length;
      if (contractictingLabelsElementCount > 0) {
        const warningMessage = `You uploaded contradicting labels for ${contractictingLabelsElementCount} element${
          contractictingLabelsElementCount > 1 ? "s" : ""
        }`;
        notify(warningMessage, { type: toast.TYPE.WARNING, toastId: "toast-contractictingLabelsInfo" });
      }

      const categoriesCreated = uploadedLabels.categoriesCreated;
      const createdCategoriesMessage = categoriesCreated.length
        ? `Added categories are: ${getCategoriesString(categoriesCreated)}`
        : "";
      updateToast(toastRef, {
        render: `New labels have been added! ${createdCategoriesMessage}`,
        type: toast.TYPE.SUCCESS,
        toastId: "toast-uploaded-labels",
      });
    }
  }, [uploadingLabels, uploadedLabels, getCategoriesString]);
};
