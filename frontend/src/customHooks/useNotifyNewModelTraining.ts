import { useEffect } from "react";
import { useNotification } from "../utils/notification";
import { useAppSelector } from "./useRedux";
import { toast } from "react-toastify";

const toastId = "model_is_training";

/**
 * This custom hooks notifies the user when a model is being trained.
 * The notification is done using a toast notification.
 * The notification isn't closed automatically (autoClose=false).
 * If the user didn't close the notification when the model training ended,
 * the toast notification is programatically closed using closeNotification()
 * from the useNotification custom hook.
 */
export const useNotifyNewModelTraining = () => {
  const { notify, closeNotification } = useNotification();

  const nextModelShouldBeTraining = useAppSelector(
    (state) => state.workspace.nextModelShouldBeTraining
  );

  useEffect(() => {
    if (nextModelShouldBeTraining) {
      notify(
        "Training a new model in the background, meanwhile you can continue labeling.",
        { toastId: toastId, type: toast.TYPE.INFO }
      );
    } else {
      closeNotification(toastId);
    }
  }, [nextModelShouldBeTraining, notify, closeNotification]);
};
