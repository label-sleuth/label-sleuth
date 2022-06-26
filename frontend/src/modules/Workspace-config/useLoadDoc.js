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
import { FILL_REQUIRED_FIELDS, NEW_DATA_CREATED } from '../../const'

const useLoadDoc = (notify, toastId) => {

    const { datasets } = useSelector((state) => state.workspaces)
    const errorMessage = useSelector((state) => state.workspaces.errorMessage);
    const isDocumentAdded = useSelector((state) => state.workspaces.isDocumentAdded);
    const dispatch = useDispatch()
    const [datasetName, setDatasetName] = useState('');
    const [file, setFile] = useState('');
    const textFieldRef = useRef()
    const comboInputTextRef = useRef()

    const updateToast = (message, type) => {
        notify(message, function (message) {
            toast.update(toastId, {
                render: message,
                type: type,
            })
        }
        )
    }

    useEffect(() => {
        if (isDocumentAdded) {
            updateToast(NEW_DATA_CREATED, toast.TYPE.SUCCESS)
        }
        else if (errorMessage) {
            updateToast(errorMessage, toast.TYPE.ERROR)
        }
    }, [isDocumentAdded, errorMessage, notify, dispatch])

    const handleInputChange = (e) => {
        setDatasetName(e.target.value);
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
        let elem = document.getElementsByClassName("MuiAutocomplete-clearIndicator")
        if (elem[0]) {
            elem[0].click()
        }
        if (textFieldRef.current) {
            textFieldRef.current.value = ''
        }
    }

    return {
        handleLoadDoc,
        handleFileChange,
        handleInputChange,
        options,
        datasets,
        textFieldRef,
        comboInputTextRef
    }
};

export default useLoadDoc;