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

import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../customHooks/useRedux";
import { toast } from "react-toastify";
import { clearError } from "./errorSlice";
import { useNotification } from "../utils/notificationHook";

/**
 * Displays a toast notification anytime an error is thrown.
 */
export const useNotifyError = () => {
  const dispatch = useAppDispatch();

  const errorMessage = useAppSelector((state) => state.error.errorMessage);
  const { notify } = useNotification();
  useEffect(() => {
    if (errorMessage) {
      notify(errorMessage, { autoClose: false, type: toast.TYPE.ERROR, toastId: "toast-error"});
      dispatch(clearError());
    }
  }, [notify, errorMessage, dispatch]);
};
