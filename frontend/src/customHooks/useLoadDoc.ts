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

import { useRef, useState, useCallback, useMemo } from "react";
import {
  addDocuments,
  deleteDataset,
} from "../modules/Workspace-config/workspaceConfigSlice";
import { toast } from "react-toastify";
import {
  FILL_REQUIRED_FIELDS,
  newDataCreatedMessage,
  UPLOAD_DOC_WAIT_MESSAGE,
  WRONG_INPUT_NAME_LENGTH,
  WRONG_INPUT_NAME_BAD_CHARACTER_NO_SPACES,
  REGEX_LETTER_NUMBERS_UNDERSCORE,
  DATASET_NAME_MAX_CHARS,
} from "../const";
import { useAppDispatch, useAppSelector } from "./useRedux";
import { useNotification } from "../utils/notification";
import React from "react";
import { isFulfilled } from "@reduxjs/toolkit";
import { stringifyList } from "../utils/utils";
import { DropdownOption } from "../components/dropdown/Dropdown";

interface UseLoadDocProps {
  toastId: string;
}

export const useLoadDoc = ({ toastId }: UseLoadDocProps) => {
  const datasets = useAppSelector((state) => state.workspaces.datasets);

  const { notify, updateNotification, closeNotification } = useNotification();
  const dispatch = useAppDispatch();

  const [datasetName, setDatasetName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>();
  const [datasetNameError, setDatasetNameError] = useState("");
  console.log(`datasetName: ${datasetName}`)
  const clearFields = useCallback(() => {
    if (fileInputRef.current) {
      (fileInputRef.current as HTMLInputElement).value = "";
    }
    setDatasetName("");
    setFile(null);
  }, []);

  const handleInputChange = (e: React.FormEvent, newVal: string | null) => {
    console.log(`e.value: ${(e.target as HTMLInputElement)?.value}`);
    console.log(`newVal: ${newVal}`);
    const val = (e.target as HTMLInputElement)?.value || newVal || "";
    console.log(`val: ${val}`);
    let error = "";
    if (val && val.length > 30) {
      error = WRONG_INPUT_NAME_LENGTH(DATASET_NAME_MAX_CHARS);
    } else if (val && !val.match(REGEX_LETTER_NUMBERS_UNDERSCORE)) {
      error = WRONG_INPUT_NAME_BAD_CHARACTER_NO_SPACES;
    }
    setDatasetNameError(error);
    setDatasetName(val);
  };

  let options: DropdownOption[] =
    datasets &&
    datasets.map((item) => ({
      value: item.dataset_id,
      title: item.dataset_id,
    }));

  const handleFileChange = (e: React.FormEvent) => {
    const files = (e.target as HTMLInputElement).files;
    setFile(files !== null ? files[0] : null);
  };

  const handleLoadDoc = () => {
    const datasetNameProvided = !!datasetName;
    const datasetFileProvided = !!file;

    if (!datasetNameProvided || !datasetFileProvided) {
      let nonProvidedFields: string;
      if (!datasetNameProvided && !datasetFileProvided) {
        nonProvidedFields = "Dataset name and csv file were not provided.";
      } else if (!datasetFileProvided) {
        nonProvidedFields = "Csv file was not provided.";
      } else {
        nonProvidedFields = "Dataset name was not provided.";
      }
      notify(FILL_REQUIRED_FIELDS(nonProvidedFields), {
        toastId,
        type: toast.TYPE.INFO,
      });
      return;
    }

    let formData = new FormData();
    formData.append("file", file);
    formData.append("dataset_name", datasetName);

    const uploadDatasetToastId = "upload_dataset_toast";
    notify(
      UPLOAD_DOC_WAIT_MESSAGE,
      { toastId: uploadDatasetToastId, type: toast.TYPE.INFO },
      true
    );

    dispatch(addDocuments(formData)).then((action) => {
      if (isFulfilled(action)) {
        const { dataset_name, num_docs, num_sentences } = action.payload;
        updateNotification({
          toastId: uploadDatasetToastId,
          render: newDataCreatedMessage(dataset_name, num_docs, num_sentences),
          type: toast.TYPE.SUCCESS,
        });
      } else {
        closeNotification(uploadDatasetToastId); // error toast notification will be displayed
      }
      clearFields();
    });
  };

  const deleteButtonEnabled = useMemo(() => {
    return (
      datasetName !== null &&
      datasetName !== "" &&
      datasets.map((d) => d.dataset_id).includes(datasetName)
    );
  }, [datasetName, datasets]);

  const handleDeleteDataset = () => {
    // Change the value optimistically to avoid warnings about
    // the value not being in the options array. If it fails
    // select that option again
    const prevValue = datasetName;
    setDatasetName("");
    dispatch(deleteDataset({ datasetName })).then(
      (actionPromiseResult: any) => {
        const {
          deleted_dataset: deletedDatasetName,
          deleted_workspace_ids: deletedWorkspaceIds,
        } = actionPromiseResult.payload;

        if (isFulfilled(actionPromiseResult)) {
          clearFields();
          notify(
            `The dataset '${deletedDatasetName}' has been succesfully deleted`,
            {
              toastId,
              type: toast.TYPE.SUCCESS,
            }
          );

          if (deletedWorkspaceIds.length > 0) {
            let words = { noun: "workspace", verb: "has been" };

            if (deletedWorkspaceIds.length > 1) {
              words.noun = "workspaces";
              words.verb = "have been";
            }

            notify(
              `The ${words.noun} '${stringifyList(deletedWorkspaceIds)}' ${
                words.verb
              } succesfully deleted too`,
              {
                toastId: `${toastId}-aditional-notification`,
                type: toast.TYPE.SUCCESS,
              }
            );
          }
        } else {
          setDatasetName(prevValue);
        }
      }
    );
  };

  return {
    datasetName,
    handleLoadDoc,
    handleFileChange,
    handleInputChange,
    options,
    datasets,
    fileInputRef,
    datasetNameError,
    deleteButtonEnabled,
    handleDeleteDataset,
    clearFields,
    file,
  };
};
