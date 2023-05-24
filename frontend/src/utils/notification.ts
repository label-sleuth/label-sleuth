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

import React from "react";
import { toast, ToastOptions, UpdateOptions } from "react-toastify";
import notificationClasses from "./Notification.module.css";

// the following options make the toast unclossable
const blockToastOptions = {
  closeButton: false,
  closeOnClick: false,
  draggable: false,
};

// the following options make the toast clossable
const unblockToastOptions = {
  closeButton: true,
  closeOnClick: true,
  draggable: true,
};

export const useNotification = () => {
  /**
   * Function to update a toast notification
   * @param toastRef: a reference to the toast returned by the notify function
   * @param options of type UpdateOptions
   * @returns void
   */
  const updateNotification = React.useCallback(
    (options: UpdateOptions, blockToast = false) => {
      if (options.toastId === null || options.toastId === undefined) return;
      toast.update(options.toastId, {
        ...(blockToast ? blockToastOptions : unblockToastOptions),
        ...options,
      });
    },
    []
  );

  const closeNotification = React.useCallback((toastId: string | number) => {
    toast.dismiss(toastId);
    const toasts = parseJSON(window.sessionStorage.getItem("toasts"));
    window.sessionStorage.setItem(
      "toasts",
      JSON.stringify(toasts.filter((id) => toastId !== id))
    );
  }, []);

  const closeAllNotifications = React.useCallback(() => {
    const toasts = parseJSON(window.sessionStorage.getItem("toasts"));
    toasts.forEach((toastId) => {
      toast.dismiss(toastId);
    });
    window.sessionStorage.setItem("toasts", JSON.stringify([]));
  }, []);

  /**
   * Shows a toast notification
   * @param {The message that will be shown} message
   * @param {options passed to the toast function like type and autoClose} options
   */
  const notify = React.useCallback(
    (message: React.ReactNode, options: ToastOptions, blockToast = false) => {
      let defaultOptions: ToastOptions = {
        type: toast.TYPE.DEFAULT,
        autoClose: false,
        bodyClassName: notificationClasses["body-toast"],
      };

      const toasts = parseJSON(window.sessionStorage.getItem("toasts"));
      
      if (toasts.includes(options.toastId || "default_toast_id")) {
        updateNotification({ ...options, render: message });
      } else {
        window.sessionStorage.setItem(
          "toasts",
          JSON.stringify([...toasts, options.toastId || "default_toast_id"])
        );
        toast(message, {
          ...defaultOptions,
          ...(blockToast ? blockToastOptions : unblockToastOptions),
          ...options,
          onClose: () => {
            closeNotification(options.toastId || "default_toast_id");
          },
        });
      }
    },
    [updateNotification, closeNotification]
  );

  return {
    notify,
    updateNotification,
    closeNotification,
    closeAllNotifications,
  };
};

// A wrapper for "JSON.parse()"" to support "undefined" value
function parseJSON(value: string | null): (string | number)[] {
  return value === null ? [] : JSON.parse(value);
}
