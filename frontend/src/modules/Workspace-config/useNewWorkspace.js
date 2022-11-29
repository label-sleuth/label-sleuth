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

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { clearState, createWorkspace, getDatasets, setActiveWorkspace } from "./workspaceConfigSlice";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import {
  FILL_REQUIRED_FIELDS,
  WRONG_INPUT_NAME_LENGTH,
  WRONG_INPUT_NAME_BAD_CHARACTER_NO_SPACES,
  REGEX_LETTER_NUMBERS_UNDERSCORE,
} from "../../const";

const useNewWorkspace = (notify, toastId) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isDocumentAdded = useSelector((state) => state.workspaces.isDocumentAdded);
  const isWorkspaceAdded = useSelector((state) => state.workspaces.isWorkspaceAdded);
  const errorMessage = useSelector((state) => state.workspaces.errorMessage);
  const [textValue, setTextValue] = useState("");
  const [newWorkspaceNameError, setNewWorkspaceNameError] = useState("");
  const [selectedValue, setSelectedValue] = useState("");

  const updateToast = useCallback(
    (message, type) => {
      notify(message, function (message) {
        toast.update(toastId, {
          render: message,
          type: type,
        });
      });
    },
    [toastId, notify]
  );

  const handleChangeText = (e) => {
    let val = e.target.value;
    let error = "";
    if (val.length > 30) {
      error = WRONG_INPUT_NAME_LENGTH;
    } else if (!val.match(REGEX_LETTER_NUMBERS_UNDERSCORE)) {
      error = WRONG_INPUT_NAME_BAD_CHARACTER_NO_SPACES;
    }
    setNewWorkspaceNameError(error);
    setTextValue(val);
  };

  useEffect(() => {
    if (errorMessage) {
      setTextValue("");
      setSelectedValue("");
      return updateToast(errorMessage, toast.TYPE.ERROR);
    }
  }, [errorMessage, updateToast]);

  useEffect(() => {
    if (isWorkspaceAdded) {
      dispatch(setActiveWorkspace(textValue));
      window.localStorage.setItem("workspaceId", JSON.stringify(textValue));
      navigate("/workspace");
    }
    return function cleanup() {
      dispatch(clearState());
    };
  }, [isWorkspaceAdded, dispatch, textValue, navigate]);

  const handleNewWorkspace = () => {
    if (!selectedValue || !textValue) {
      return notify(FILL_REQUIRED_FIELDS, function (message) {
        toast.update(toastId, {
          render: message,
          type: toast.TYPE.INFO,
        });
      });
    }
    dispatch(createWorkspace({ workspace_id: textValue, dataset_id: selectedValue }));
  };

  useEffect(() => {
    if (isDocumentAdded) {
      dispatch(getDatasets());
    }
  }, [isDocumentAdded, dispatch]);

  const handleDatasetChange = (value) => {
    setSelectedValue(value);
  };

  return {
    handleChangeText,
    handleDatasetChange,
    handleNewWorkspace,
    selectedValue,
    textValue,
    newWorkspaceNameError,
  };
};

export default useNewWorkspace;
