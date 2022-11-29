import React from "react";
import { usePrevious } from "../../../../customHooks/usePrevious";

/**
 * Custom hook for triggering notifications when a new model is available 
 */
export const useNewModelNotifications = ({
  curCategory,
  modelVersion,
  fire,
  dispatch,
  notifySuccess,
  fireConfetti,
}) => {
  const prevModelVersion = usePrevious(modelVersion);
  const newModelVersionAvailable = React.useMemo(
    () => prevModelVersion !== null && modelVersion !== null && modelVersion > -1 && prevModelVersion !== modelVersion,
    [prevModelVersion, modelVersion]
  );

  React.useEffect(() => {
    if (curCategory !== null && newModelVersionAvailable === true) {
      fireConfetti && fire();
      if (modelVersion === 1) {
        notifySuccess("A new model is available!", "toast-new-model");
        notifySuccess("There are new suggestions for labeling!", "toast-new-suggestions-for-labelling");
      }
    }
  }, [curCategory, newModelVersionAvailable, modelVersion, fire, notifySuccess, dispatch, fireConfetti]);
};
