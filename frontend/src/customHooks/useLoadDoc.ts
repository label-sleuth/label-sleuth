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

import { useEffect, useRef, useState, useCallback } from "react";
import { addDocuments } from "../modules/Workspace-config/workspaceConfigSlice";
import { toast } from "react-toastify";
import {
  FILL_REQUIRED_FIELDS,
  newDataCreatedMessage,
  UPLOAD_DOC_WAIT_MESSAGE,
  WRONG_INPUT_NAME_LENGTH,
  WRONG_INPUT_NAME_BAD_CHARACTER_NO_SPACES,
  REGEX_LETTER_NUMBERS_UNDERSCORE,
} from "../const";
import { useAppDispatch, useAppSelector } from "./useRedux";
import { notify, updateToast } from "../utils/notification";
import React from "react";

interface UseLoadDocProps {
  toastId: string;
}

export const useLoadDoc = ({ toastId }: UseLoadDocProps) => {
  const uploadingDataset = useAppSelector((state) => state.workspaces.uploadingDataset);
  const { datasets } = useAppSelector((state) => state.workspaces);
  const isDocumentAdded = useAppSelector((state) => state.workspaces.isDocumentAdded);
  const { dataset_name, num_docs, num_sentences } = useAppSelector((state) =>
    state.workspaces.datasetAdded !== null
      ? state.workspaces.datasetAdded
      : { dataset_name: "", num_docs: -1, num_sentences: -1 }
  );

  const toastRef = React.useRef<React.ReactText | null>(null);

  const dispatch = useAppDispatch();

  const [datasetName, setDatasetName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const textFieldRef = useRef();
  const comboInputTextRef = useRef();
  const [datasetNameError, setDatasetNameError] = useState("");

  const clearFields = useCallback(() => {
    let elem: HTMLCollectionOf<Element> = document.getElementsByClassName("MuiAutocomplete-clearIndicator");
    if (elem[0]) {
      (elem[0] as HTMLElement).click();
    }
    if (textFieldRef.current) {
      (textFieldRef.current as HTMLInputElement).value = "";
    }
    setDatasetName("");
    if (comboInputTextRef.current) {
      (comboInputTextRef.current as HTMLInputElement).value = "";
    }
    setFile(null);
  }, []);

  useEffect(() => {
    if (uploadingDataset) {
      toastRef.current = notify(UPLOAD_DOC_WAIT_MESSAGE, { toastId, type: toast.TYPE.INFO }, true);
    } else if (isDocumentAdded) {
      updateToast(toastRef, { render: newDataCreatedMessage(dataset_name, num_docs, num_sentences), type: toast.TYPE.SUCCESS })
      clearFields();
    }
  }, [toastId, dataset_name, num_docs, num_sentences, isDocumentAdded, uploadingDataset, clearFields, dispatch]);

  const handleInputChange = (e: React.FormEvent, newVal: string) => {
    const val = newVal || (e.target as HTMLInputElement).value;

    let error = "";
    if (val && val.length > 30) {
      error = WRONG_INPUT_NAME_LENGTH;
    } else if (val && !val.match(REGEX_LETTER_NUMBERS_UNDERSCORE)) {
      error = WRONG_INPUT_NAME_BAD_CHARACTER_NO_SPACES;
    }
    setDatasetNameError(error);
    setDatasetName(val);
  };

  let options = datasets && datasets.map((item) => ({ value: item.dataset_id, title: item.dataset_id }));

  const handleFileChange = (e: React.FormEvent) => {
    const files = (e.target as HTMLInputElement).files;
    setFile(files !== null ? files[0] : null);
  };

  const handleLoadDoc = () => {
    if (!datasetName || !file) {
      return notify(FILL_REQUIRED_FIELDS, { toastId, type: toast.TYPE.INFO });
    }
    let formData = new FormData();
    formData.append("file", file);
    formData.append("dataset_name", datasetName);
    dispatch(addDocuments(formData));
  };

  return {
    handleLoadDoc,
    handleFileChange,
    handleInputChange,
    options,
    datasets,
    textFieldRef,
    comboInputTextRef,
    datasetNameError,
  };
};
