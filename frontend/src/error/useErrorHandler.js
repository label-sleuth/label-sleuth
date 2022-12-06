import { useEffect, useRef, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { clearError } from "./errorSlice";
/*
    Copyright (c) 2022 IBM Corp.
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

/**
 * Displays a toast notification anytime an error is thrown.
 */
export const useErrorHandler = () => {
  const toastRef = useRef(null);
  const dispatch = useDispatch();

  const errorMessage = useSelector((state) => state.error.errorMessage);

  const toastId = "toast-error";

  const toastOptions = useMemo(
    () => ({
      autoClose: 5000,
      type: toast.TYPE.ERROR,
      toastId: toastId,
    }),
    []
  );

  const notify = useCallback(
    (message) => {
      toastRef.current = toast(message, toastOptions);
    },
    [toastOptions]
  );

  useEffect(() => {
    if (errorMessage) {
      notify(errorMessage);
      dispatch(clearError());
    }
  }, [errorMessage, dispatch, notify]);
};
