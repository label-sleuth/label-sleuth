import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { checkModelUpdate } from "../../redux/modelSlice";

export const useCheckModelState = ({ curCategory, nextModelShouldBeTraining, checkModelInterval }) => {
  /**
   * Update the model state every checkModelInterval milliseconds
   * Do it only if nextModelShouldBeTraining is true
   */
  const dispatch = useDispatch();

  useEffect(() => {
    const interval = setInterval(() => {
      if (curCategory != null && nextModelShouldBeTraining) {
        dispatch(checkModelUpdate());
      }
    }, checkModelInterval);

    return () => clearInterval(interval);
  }, [curCategory, checkModelInterval, nextModelShouldBeTraining, dispatch]);
};
