import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { preloadDataset } from "../redux/documentSlice";

export const usePreloadDataset = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(preloadDataset());
  }, [dispatch]);
};
