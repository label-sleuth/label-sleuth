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
import { createWorkspace, getDatasetsAPI, setActiveWorkspace, setIsToastActive } from './workspaceConfigSlice'
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux'

const useNewWorkspace = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [textValue, setTextValue] = useState('');
    const isToastActive = useSelector((state) => state.workspaces.isToastActive);

    const handleChangeText = (e) => {
        let val = e.target.value
        const formatted = val.replace(/[^a-zA-Z0-9]/g, '_');
        setTextValue(formatted);
    };

    const handleNewWorkspace = () => {
        if (!selectedValue || !textValue) {
            return notify("Please fill out all the required fields!")
        }
        dispatch(createWorkspace({ workspace_id: textValue, dataset_id: selectedValue }))
        dispatch(setActiveWorkspace(textValue))
        window.localStorage.setItem('workspaceId', JSON.stringify(textValue));
        navigate('/workspace')
    }

    useEffect(() => {
        dispatch(getDatasetsAPI())
    }, [dispatch])

    const [selectedValue, setSelectedValue] = useState('');
    const handleDatasetChange = (value) => {
        setSelectedValue(value);
    };

    function notify(message) {
        dispatch(setIsToastActive(true))
        toast(message, {
            onClose: () => {
                dispatch(setIsToastActive(false))
            }
        });
    }

    return {
        handleChangeText,
        handleDatasetChange,
        handleNewWorkspace,
        selectedValue,
        textValue,
        isToastActive,
    }
};

export default useNewWorkspace;