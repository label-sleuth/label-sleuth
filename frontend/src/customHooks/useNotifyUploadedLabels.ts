import { useCallback, useEffect } from "react";
import { useAppSelector } from "./useRedux";
import { useNotification } from "../utils/notification";
import { UPLOAD_LABELS_WAIT_MESSAGE } from "../const";
import { toast } from "react-toastify";
import { usePrevious } from "./usePrevious";

export const useNotifyUploadedLabels = () => {
  const uploadedLabels = useAppSelector((state) => state.workspace.uploadedLabels);
  const uploadingLabels = useAppSelector((state) => state.workspace.uploadingLabels);
  const { notify, updateNotification, closeNotification } = useNotification();

  const getCategoriesString = useCallback((categories: string[]) => {
    if (categories.length === 1) return categories[0];
    else {
      let res = "";
      if (categories.length > 2) categories.slice(0, -2).forEach((c) => (res += `'${c}', `));
      res += `'${categories.slice(-2, -1)[0]}' and '${categories.slice(-1)[0]}'`;
      return res;
    }
  }, []);

  const previousUploadingLabels = usePrevious(uploadingLabels);

  useEffect(() => {
    const toastId = "upload-labels-notification";
    if (uploadingLabels) {
      notify(UPLOAD_LABELS_WAIT_MESSAGE, { type: toast.TYPE.INFO, toastId }, true);
    } else if (uploadedLabels !== null) {
      const categoriesCreated = uploadedLabels.categoriesCreated;
      const createdCategoriesMessage = categoriesCreated.length
        ? `Added categories are: ${getCategoriesString(categoriesCreated)}`
        : "";
      updateNotification({
        toastId,
        render: `New labels have been added! ${createdCategoriesMessage}`,
        type: toast.TYPE.SUCCESS,
      });

      // if the user uploaded labels that were contradicting display a warning notification
      const contractictingLabelsElementCount = uploadedLabels.contracticting_labels_info.elements.length;
      if (contractictingLabelsElementCount > 0) {
        const warningMessage = `You uploaded contradicting labels for ${contractictingLabelsElementCount} element${
          contractictingLabelsElementCount > 1 ? "s" : ""
        }`;
        notify(warningMessage, { type: toast.TYPE.WARNING, toastId: "toast-contractictingLabelsInfo" });
      }
    } else if (previousUploadingLabels === true && uploadedLabels === null) {
      console.log("closing notificaiton");
      closeNotification(toastId);
    }
  }, [
    notify,
    updateNotification,
    closeNotification,
    previousUploadingLabels,
    uploadingLabels,
    uploadedLabels,
    getCategoriesString,
  ]);
};
