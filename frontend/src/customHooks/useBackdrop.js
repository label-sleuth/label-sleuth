import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { POS_PREDICTIONS } from '../const'

const useBackdrop = () => {

    const [openBackdrop, setOpenBackdrop] = useState(false);
    const isDocLoaded = useSelector(state => state.workspace.isDocLoaded)
    const activePanel = useSelector(state => state.workspace.activePanel)
    const deletingCategory = useSelector(state => state.workspace.deletingCategory)
    const posPredTotalElemRes = useSelector(state => state.workspace.posPredTotalElemRes)
    const curDocName = useSelector(state => state.workspace.curDocName)
    const uploadingDataset = useSelector((state) => state.workspaces.uploadingDataset);
    const location = useLocation();

    useEffect(() => {
        if (location.pathname === "/workspace") {
            setOpenBackdrop(
                deletingCategory ||
                !curDocName ||
                !isDocLoaded ||
                (!posPredTotalElemRes && activePanel == POS_PREDICTIONS)
            )
        }
        else if (location.pathname === "/workspace_config") {
            setOpenBackdrop(uploadingDataset)
        }
    }, [location.pathname, uploadingDataset, curDocName, isDocLoaded, activePanel, posPredTotalElemRes])

    return {
        openBackdrop
    }
};

export default useBackdrop;