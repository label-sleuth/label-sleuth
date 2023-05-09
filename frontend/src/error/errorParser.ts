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

import { ErrorResponse, Error } from "../global";

/**
 * Get the error message from the error object.
 * @param {the error returned by the redux thunk} err
 * @returns the error message
 */
export const parseError = (err: ErrorResponse): Error => {
  const defaultErrorMessage =
    "Something went wrong. Please ask your system administrator to share the logs by creating an issue on Github or sending a message via Slack.";
  if (err.message) {
    try {
      const error: Error = JSON.parse(err.message);
      return error;
    } catch {
      return { title: defaultErrorMessage };
    }
  } else {
    return { title: defaultErrorMessage };
  }
};
