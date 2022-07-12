import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { clearError } from "./DataSlice";

export const useErrorHandler = () => {
  const toastRef = useRef(null);
  const dispatch = useDispatch()

  const errorMessage = useSelector((state) => state.workspace.errorMessage);

  const toastId = "toast-error";

  const toastOptions = {
    autoClose: 5000,
    type: toast.TYPE.ERROR,
    toastId: toastId
  };

  const notify = (message) => {
    toastRef.current = toast(message, toastOptions);
  };


  useEffect(() => {
    if (errorMessage) {
      notify(errorMessage);
      dispatch(clearError())
    }
  }, [errorMessage]);
};
