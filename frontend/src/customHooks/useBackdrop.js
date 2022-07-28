import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { sidebarOptionEnum } from '../const'

const useBackdrop = () => {

    const [openBackdrop, setOpenBackdrop] = useState(false);
    const isDocLoaded = useSelector(state => state.workspace.isDocLoaded)
    const activePanel = useSelector(state => state.workspace.activePanel)
    const deletingCategory = useSelector(state => state.workspace.deletingCategory)
    const uploadingLabels = useSelector(state => state.workspace.uploadingLabels)
    const downloadingLabels = useSelector(state => state.workspace.downloadingLabels)
    const posPredTotalElemRes = useSelector(state => state.workspace.posPredTotalElemRes)
    const curDocName = useSelector(state => state.workspace.curDocName)
    const uploadingDataset = useSelector((state) => state.workspaces.uploadingDataset);
    const location = useLocation();

    useEffect(() => {
        if (location.pathname === "/workspace") {
            setOpenBackdrop(
                uploadingLabels ||
                downloadingLabels ||
                deletingCategory ||
                !curDocName ||
                !isDocLoaded ||
                (!posPredTotalElemRes && activePanel === sidebarOptionEnum.POSITIVE_PREDICTIONS)
            )
        }
        else if (location.pathname === "/workspace_config") {
            setOpenBackdrop(uploadingDataset)
        }
    }, [location.pathname, uploadingDataset, curDocName, isDocLoaded, activePanel, posPredTotalElemRes, uploadingLabels, downloadingLabels])

    return {
        openBackdrop
    }
};

export default useBackdrop;