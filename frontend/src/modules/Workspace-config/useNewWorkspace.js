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

import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { createWorkspace, getDatasets, setActiveWorkspace } from './workspaceConfigSlice'
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux'
import { FILL_REQUIRED_FIELDS } from '../../const'

const useNewWorkspace = (notify, toastId) => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const isDocumentAdded = useSelector((state) => state.workspaces.isDocumentAdded);
    const [textValue, setTextValue] = useState('');

    const handleChangeText = (e) => {
        let val = e.target.value
        const formatted = val.replace(/[^a-zA-Z0-9]/g, '_');
        setTextValue(formatted);
    };

    const handleNewWorkspace = () => {
        if (!selectedValue || !textValue) {
            return notify(FILL_REQUIRED_FIELDS, function (message) {
                toast.update(toastId, {
                    render: message,
                    type: toast.TYPE.INFO,
                })
            })
        }
        dispatch(createWorkspace({ workspace_id: textValue, dataset_id: selectedValue }))
        dispatch(setActiveWorkspace(textValue))
        window.localStorage.setItem('workspaceId', JSON.stringify(textValue));
        navigate('/workspace')
    }

    useEffect(() => {
        if (isDocumentAdded) {
            dispatch(getDatasets())
        }
    }, [isDocumentAdded])

    const [selectedValue, setSelectedValue] = useState('');
    const handleDatasetChange = (value) => {
        setSelectedValue(value);
    };

    return {
        handleChangeText,
        handleDatasetChange,
        handleNewWorkspace,
        selectedValue,
        textValue,
    }
};

export default useNewWorkspace;