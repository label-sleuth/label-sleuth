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

import React, { ReactNode } from "react";
import { toast, ToastOptions, UpdateOptions } from "react-toastify";

// TODO:transform this file into a custom hook so that it handles the ref to the ReactText object
// this way  components that use updateToast won't have to worry about the ref to the ReactText object
// this custom hook would have to maintain a dict of toastId:ref so that a  single instance of this
// hook can manage several toast notifications.

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

/**
 * Shows a toast notification
 * @param {The message that will be shown} message
 * @param {options passed to the toast function like type and autoClose} options
 */
export const notify = (message: React.ReactNode, options: ToastOptions, blockToast = false) => {
  let defaultOptions: ToastOptions = {
    type: toast.TYPE.DEFAULT,
    autoClose: false,
  };

  return toast(message, { ...defaultOptions, ...options, ...(blockToast ? blockToastOptions : unblockToastOptions) });
};

/**
 * Function to update a toast notification
 * @param toastRef: a reference to the toast returned by the notify function
 * @param options of type UpdateOptions
 * @returns void
 */
export const updateToast = (
  toastRef: React.MutableRefObject<React.ReactText | null>,
  options: UpdateOptions,
  blockToast = false
) => {
  if (toastRef.current === null) return;
  toast.update(toastRef.current, { ...options, ...(blockToast ? blockToastOptions : unblockToastOptions) });
};
