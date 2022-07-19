import { toast } from 'react-toastify';

/**
 * Shows a toast notification
 * @param {The message that will be shown} message
 * @param {options passed to the toast function like type and autoClose} options 
 */
export const notify = (message, options) => {
    const defaultOptions = {
        type: toast.TYPE.DEFAULT,
    }
    toast(message, options ?? defaultOptions);
  }