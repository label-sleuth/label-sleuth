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
import { useNotification } from "../utils/notification";
import React from "react";
import { ToastContentWithShowMore } from "./ToastContentWithShowMore";

interface useNotifyErrorProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Displays a toast notification anytime an error is thrown.
 */
export const useNotifyError = ({ open, setOpen }: useNotifyErrorProps) => {
  const dispatch = useAppDispatch();
  const { error, hackyToggle } = useAppSelector((state) => state.error);
  const { notify } = useNotification();

  useEffect(() => {
    if (error !== null) {
      const toNotify = (
        <ToastContentWithShowMore error={error} setOpen={setOpen} />
      );

      notify(toNotify, {
        autoClose: false,
        type: toast.TYPE.ERROR,
        toastId: error.type,
        draggable: false,
      });
    }
  }, [hackyToggle, error, notify, setOpen, dispatch]);
};
