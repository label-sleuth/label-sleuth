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
import { usePrevious } from "./usePrevious";
import { notify } from "../utils/notification";
import { useAppDispatch } from "./useRedux";
import { toast } from "react-toastify";

interface UseNewModelNotifications {
  curCategory: number | null;
  modelVersion: number | null;
  shouldFireConfetti: boolean;
  fire: () => void;
}

/**
 * Custom hook for triggering notifications when a new model is available
 */
export const useNewModelNotifications = ({
  curCategory,
  modelVersion,
  fire,
  shouldFireConfetti,
}: UseNewModelNotifications) => {
  const dispatch = useAppDispatch();
  const prevModelVersion = usePrevious(modelVersion);
  const newModelVersionAvailable = React.useMemo(
    () => prevModelVersion !== null && modelVersion !== null && modelVersion > -1 && prevModelVersion !== modelVersion,
    [prevModelVersion, modelVersion]
  );

  React.useEffect(() => {
    if (curCategory !== null && newModelVersionAvailable === true) {
      shouldFireConfetti && fire();
      if (modelVersion === 1) {
        notify("A new model is available!", { type: toast.TYPE.SUCCESS, toastId: "toast-new-model" });
        notify("There are new suggestions for labeling!", {
          type: toast.TYPE.SUCCESS,
          toastId: "toast-new-suggestions-for-labelling",
        });
      }
    }
  }, [curCategory, newModelVersionAvailable, modelVersion, fire, dispatch, shouldFireConfetti]);
};
