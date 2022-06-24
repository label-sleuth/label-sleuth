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
import { getWorkspaces, setActiveWorkspace } from './workspaceConfigSlice'
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { WORKSPACE_PATH } from '../../config';
import {SELECT_WORKSPACE} from '../../const'

const useExistWorkspace = (notify, toastId) => {

    const { workspaces } = useSelector((state) => state.workspaces)

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

    const handleClick = () => {
        if (!value) {
            return notify(SELECT_WORKSPACE, function (message) {
                toast.update(toastId, {
                    render: message,
                    type: toast.TYPE.INFO,
                })
            })
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
    }
};

export default useExistWorkspace;