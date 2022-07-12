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


import { useEffect, useRef, useState } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { addDocuments } from './workspaceConfigSlice'
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux'
import {
  FILL_REQUIRED_FIELDS,
  newDataCreatedMessage,
  UPLOAD_DOC_WAIT_MESSAGE,
  WRONG_INPUT_NAME_LENGTH,
  WRONG_INPUT_NAME_BAD_CHARACTER_NO_SPACES,
  REGEX_LETTER_NUMBERS_UNDERSCORE,
} from "../../const";

const useLoadDoc = (notify, toastId) => {

    const workspaces = useSelector((state) => state.workspaces)
    const uploadingDataset = useSelector((state) => state.workspaces.uploadingDataset);
    const { datasets } = useSelector((state) => state.workspaces)
    const errorMessage = useSelector((state) => state.workspaces.errorMessage);
    const isDocumentAdded = useSelector((state) => state.workspaces.isDocumentAdded);
    const {dataset_name, num_docs, num_sentences} = {...workspaces.document}
    const dispatch = useDispatch()
    const [datasetName, setDatasetName] = useState('');
    const [file, setFile] = useState('');
    const textFieldRef = useRef()
    const comboInputTextRef = useRef()
    const [datasetNameError, setDatasetNameError] = useState("")

    const updateToast = (message, type) => {
        notify(message, function (message) {
            toast.update(toastId, {
                render: message,
                type: type,
            })
        }
        )
    }

    const clearFields = () =>{
        let elem = document.getElementsByClassName("MuiAutocomplete-clearIndicator")
        if (elem[0]) {
            elem[0].click()
        }
        if (textFieldRef.current) {
            textFieldRef.current.value = ''
        }
        setDatasetName('')
        if (comboInputTextRef.current) {
            comboInputTextRef.current.value = ''
        }
        setFile('')
    }

    useEffect(() => {
        if(uploadingDataset){
            updateToast(UPLOAD_DOC_WAIT_MESSAGE, toast.TYPE.INFO)
        }
         else if (isDocumentAdded) {
            updateToast(newDataCreatedMessage(dataset_name, num_docs, num_sentences), toast.TYPE.SUCCESS)
            clearFields()
        }
        else if (errorMessage) {
            updateToast(errorMessage, toast.TYPE.ERROR)
            clearFields()
        }

    }, [isDocumentAdded, uploadingDataset, errorMessage, clearFields, updateToast, dispatch])

    const handleInputChange = (e, newVal) => {
       
        const val = newVal || e.target.value
     
        let error = ""
        if (val && val.length > 30) {
            error = WRONG_INPUT_NAME_LENGTH
        }
        else if (val && !val.match(REGEX_LETTER_NUMBERS_UNDERSCORE)) {
            error = WRONG_INPUT_NAME_BAD_CHARACTER_NO_SPACES
        }
        setDatasetNameError(error)
        setDatasetName(val);
    };

    let options = datasets && datasets.map((item) => ({ value: item.dataset_id, title: item.dataset_id }))

    const handleFileChange = (e) => {
        setFile(e.target.files[0])
    }

    const handleLoadDoc = () => {
       if (!datasetName || !file) {
            return notify(FILL_REQUIRED_FIELDS, function (message) {
                toast.update(toastId, {
                    render: message,
                    type: toast.TYPE.INFO,
                })
            }
            )
        }
        let formData = new FormData()
        formData.append('file', file);
        formData.append('dataset_name', datasetName)
        dispatch(addDocuments(formData))
    }

    return {
        handleLoadDoc,
        handleFileChange,
        handleInputChange,
        options,
        datasets,
        textFieldRef,
        comboInputTextRef,
        datasetNameError
    }
};

export default useLoadDoc;
