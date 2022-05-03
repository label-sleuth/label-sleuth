import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux'
import { getWorkspaces } from './workspaceConfigSlice'
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const useExistWorkspace = () => {

    const notify = (message) => toast(message);
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

    const handleClick = (e) => {
        if (!value) {
            return notify("Please select workspace!")
        }
        navigate('/workspace')
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