import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { panelIds } from "../const";

const useBackdrop = () => {
  const [openBackdrop, setOpenBackdrop] = useState(false);
  const isDocLoaded = useSelector((state) => state.workspace.isDocLoaded);
  const activePanelId = useSelector(
    (state) => state.workspace.panels.activePanelId
  );
  const panelsLoading = useSelector((state) => state.workspace.panels.loading);
  const deletingCategory = useSelector(
    (state) => state.workspace.deletingCategory
  );
  const uploadingLabels = useSelector(
    (state) => state.workspace.uploadingLabels
  );
  const downloadingLabels = useSelector(
    (state) => state.workspace.downloadingLabels
  );
  const downloadingModel = useSelector(
    (state) => state.workspace.downloadingModel
  );
  const curDocName = useSelector((state) => state.workspace.curDocName);
  const uploadingDataset = useSelector(
    (state) => state.workspaces.uploadingDataset
  );

  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/workspace") {
      setOpenBackdrop(
        uploadingLabels ||
          downloadingLabels ||
          deletingCategory ||
          downloadingModel ||
          !curDocName ||
          !isDocLoaded ||
          panelsLoading[panelIds.MAIN_PANEL] 
          //panelsLoading[panelIds.LABEL_NEXT]
      );
    } else if (location.pathname === "/workspace_config") {
      setOpenBackdrop(uploadingDataset);
    }
  }, [
    location.pathname,
    uploadingDataset,
    curDocName,
    isDocLoaded,
    panelsLoading,
    activePanelId,
    uploadingLabels,
    downloadingLabels,
    downloadingModel,
  ]);

  return {
    openBackdrop,
  };
};

export default useBackdrop;
