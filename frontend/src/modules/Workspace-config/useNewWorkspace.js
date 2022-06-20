import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { createWorkspace, getDatasetsAPI, setActiveWorkspace } from './workspaceConfigSlice'
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux'

const useNewWorkspace = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const [textValue, setTextValue] = useState('');

    const handleChangeText = (e) => {
        let val = e.target.value
        const formatted = val.replace(/[^a-zA-Z0-9]/g,'_');  
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

    const notify = (message) => toast(message);
    return {
        handleChangeText,
        handleDatasetChange,
        handleNewWorkspace,
        selectedValue,
        textValue,
    }
};

export default useNewWorkspace;