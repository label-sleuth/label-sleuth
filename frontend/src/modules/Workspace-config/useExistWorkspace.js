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