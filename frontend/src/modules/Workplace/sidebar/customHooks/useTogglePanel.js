import { useDispatch } from 'react-redux';
import { getElementToLabel, setActivePanel } from '../../DataSlice';


const useTogglePanel = (setOpen) => {

    const dispatch = useDispatch()

    const handleDrawerOpen = () => {
        setOpen(true);
    };

    const handleDrawerClose = () => {
        setOpen(false);
        dispatch(setActivePanel(""))
    };

    const activateSearchPanel = () => {
        dispatch(setActivePanel("search"))
        handleDrawerOpen()
    }

    const activateRecToLabelPanel = () => {
        dispatch(setActivePanel("rcmd"))
        dispatch(getElementToLabel())
        handleDrawerOpen()
    }

    return {
        handleDrawerClose,
        activateSearchPanel,
        activateRecToLabelPanel,
    }
};

export default useTogglePanel;