import {
  getElementToLabel,
  checkStatus,
  fetchCategories,
  fetchDocuments,
  setIsDocLoaded,
  setIsCategoryLoaded,
  checkModelUpdate,
  fetchElements,
  getPositiveElementForCategory,
  setFocusedState,
} from "./DataSlice.jsx";
import * as React from "react";
import { useDispatch, useSelector } from "react-redux";

/**
 * Custom hook for dispatching workspace related actions
 **/
const useWorkspaceState = () => {
  const dispatch = useDispatch();
  const workspace = useSelector((state) => state.workspace);

  React.useEffect(() => {
    // fetch documents only once, they won't change
    dispatch(setIsCategoryLoaded(false));
    dispatch(setIsDocLoaded(false));
    dispatch(fetchDocuments()).then(() => {
      dispatch(fetchElements()).then(() => {
        dispatch(setIsCategoryLoaded(true));
        dispatch(setIsDocLoaded(true));
      });
    });
    // fetch categories only once, they will be fetched again if a new category is added
    dispatch(fetchCategories());
  }, []);

  React.useEffect(() => {
    // reset the focused stata when the category changes
    dispatch(setFocusedState(null))
    // update the model version when the category changes (if any)
    if (workspace.curCategory) {
      dispatch(checkModelUpdate());
    }
  }, [workspace.curCategory]);

  React.useEffect(() => {
    // category changes or model_version changes means
    // that recommend to label and positive predicted text entries has to be updated
    // also the status is updated
    if (workspace.curCategory && workspace.model_version >= 0) {
      dispatch(getElementToLabel());
      dispatch(getPositiveElementForCategory());
      dispatch(checkStatus());
    }
  }, [workspace.curCategory, workspace.model_version]);

  React.useEffect(() => {
    // document changes and category is set and there is a model available
    // the positive predicted text entries has to be updated
    if (workspace.curCategory && workspace.model_version >= 0) {
      dispatch(getPositiveElementForCategory());
    }
  }, [workspace.curDocName]);
};

export default useWorkspaceState;
