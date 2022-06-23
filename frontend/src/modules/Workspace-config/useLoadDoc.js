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
import { clearState, getDatasetsAPI, setIsToastActive } from './workspaceConfigSlice'
import 'react-toastify/dist/ReactToastify.css';
import { addDocuments } from './workspaceConfigSlice'
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux'
import { FILL_REQUIRED_FIELDS, NEW_DATA_CREATED } from '../../const'

const useLoadDoc = () => {

    const { datasets } = useSelector((state) => state.workspaces)
    const errorMessage = useSelector((state) => state.workspaces.errorMessage);
    const isDocumentAdded = useSelector((state) => state.workspaces.isDocumentAdded);
    const isToastActive = useSelector((state) => state.workspaces.isToastActive);
    const dispatch = useDispatch()
    const [datasetName, setDatasetName] = useState('');
    const [file, setFile] = useState('');
    const textFieldRef = useRef()
    const comboInputTextRef = useRef()

    function notify(message) {
        dispatch(setIsToastActive(true))
        toast(message, {
            autoClose: 15000, 
            onClose: () => {
                dispatch(setIsToastActive(false))
                if (isDocumentAdded || errorMessage) {
                    dispatch(clearState())
                }
            }
        });
    }

    useEffect(() => {
        if (isDocumentAdded) {
            notify(NEW_DATA_CREATED)
        }
        else if (errorMessage) {
            notify(errorMessage)
        }
    }, [isDocumentAdded, errorMessage])

    const handleInputChange = (e) => {
        setDatasetName(e.target.value);
    };

    let options = datasets && datasets.map((item) => ({ value: item.dataset_id, title: item.dataset_id }))

    const handleFileChange = (e) => {
        setFile(e.target.files[0])
    }

    const handleLoadDoc = () => {
        if (!errorMessage && (!datasetName || !file)) {
            return notify(FILL_REQUIRED_FIELDS)
        }
        let formData = new FormData()
        formData.append('file', file);
        formData.append('dataset_name', datasetName)
        dispatch(addDocuments(formData))
        dispatch(getDatasetsAPI())
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
        isToastActive,
        comboInputTextRef
    }
};

export default useLoadDoc;