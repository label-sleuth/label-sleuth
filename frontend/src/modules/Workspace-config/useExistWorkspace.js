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
import { useDispatch, useSelector } from 'react-redux'
import { getWorkspaces, setActiveWorkspace, setIsToastActive } from './workspaceConfigSlice'
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { WORKSPACE_PATH } from '../../config';

const useExistWorkspace = () => {

    const { workspaces } = useSelector((state) => state.workspaces)
    const isToastActive = useSelector((state) => state.workspaces.isToastActive)

    function notify(message) {
        dispatch(setIsToastActive(true))
        toast(message, {
            onClose: () => {
                dispatch(setIsToastActive(false))
            }
        });
    }

    let navigate = useNavigate();
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(getWorkspaces())
    }, [dispatch])

    useEffect(() => {
        dispatch(getWorkspaces())
    }, [dispatch])

    const [value, setValue] = useState('');
    const handleChange = (value) => {
        setValue(value);
    };

    const handleClick = (e) => {
        if (!value) {
            return notify("Please select workspace!")
        }
        dispatch(setActiveWorkspace(value))
        window.localStorage.setItem('workspaceId', JSON.stringify(value));
        navigate(WORKSPACE_PATH)
    };

    const options = workspaces.map((item) => ({ value: item, title: item }))

    return {
        handleClick,
        handleChange,
        value,
        options,
        isToastActive,
    }
};

export default useExistWorkspace;