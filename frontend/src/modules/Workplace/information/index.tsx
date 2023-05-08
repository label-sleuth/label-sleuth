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

import { useEffect, useState, useMemo } from "react";
import ReactCanvasConfetti from "react-canvas-confetti";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";

import { SystemVersion } from "../../../components/version/SystemVersion";
import classes from "./WorkspaceInfo.module.css";
import { LEFT_DRAWER_WIDTH } from "../../../const";

import {
  UploadLabelsDialog,
  DownloadLabelsDialog,
  DownloadModelDialog,
} from "./FileTransferLabels";
import { getOrdinalSuffix } from "../../../utils/utils";
import { SupportIconsBar } from "../../../components/SupportIconsBar";

import { useCheckModelState } from "../../../customHooks/useCheckModelState";
import { useConfetti } from "../../../customHooks/useConfetti";
import { useNewModelNotifications } from "../../../customHooks/useNewModelNotifications";
import { useAppSelector, useAppDispatch } from "../../../customHooks/useRedux";
import { fetchVersion } from "../redux";
import { useNotifyUploadedLabels } from "../../../customHooks/useNotifyUploadedLabels";
import { Header } from "./Header";
import { WorkspaceInfoAndActions } from "./WorkspaceInfoAndActions";

interface WorkspaceInfoProps {
  setTutorialOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  checkModelInterval?: number;
  shouldFireConfetti?: boolean;
}

/**
 * The information left sidebar of the worksplace
 * @param workspaceId - the id of the current workspace
 * @param setTutorialOpen - whether tutorial should be opened
 * @param checkModelInterval - the interval time at which the model state is checked if an update is expected
 * @param fireConfetti - whether to fire confetti when a new model is available. Only disabled in tests.
 */
export const WorkspaceInfo = ({
  setTutorialOpen,
  checkModelInterval = 5000,
  shouldFireConfetti = true,
}: WorkspaceInfoProps) => {
  const curCategory = useAppSelector((state) => state.workspace.curCategory);
  const modelVersion = useAppSelector((state) => state.workspace.modelVersion);

  const dispatch = useAppDispatch();
  const { getInstance, fire } = useConfetti();

  useCheckModelState({ checkModelInterval });
  useNewModelNotifications({
    curCategory,
    modelVersion,
    shouldFireConfetti,
    fire,
  });
  
  useNotifyUploadedLabels();

  const [uploadLabelsDialogOpen, setUploadLabelsDialogOpen] = useState(false);
  const [downloadLabelsDialogOpen, setDownloadLabelsDialogOpen] = useState(false);
  const [downloadModelDialogOpen, setDownloadModelDialogOpen] = useState(false);

  const modelVersionSuffix = useMemo(
    () => (modelVersion !== null ? getOrdinalSuffix(modelVersion) : null),
    [modelVersion]
  );

  useEffect(() => {
    dispatch(fetchVersion());
  }, [dispatch]);

  return (
    <>
      <UploadLabelsDialog open={uploadLabelsDialogOpen} setOpen={setUploadLabelsDialogOpen} />
      <DownloadLabelsDialog open={downloadLabelsDialogOpen} setOpen={setDownloadLabelsDialogOpen} />
      <DownloadModelDialog
        open={downloadModelDialogOpen}
        setOpen={setDownloadModelDialogOpen}
        modelVersion={modelVersion}
        modelVersionSuffix={modelVersionSuffix}
      />
      <Box
        style={{
          backgroundColor: "#161616",
          width: LEFT_DRAWER_WIDTH,
          height: "100vh",
        }}
      >
        <ReactCanvasConfetti refConfetti={getInstance} className={classes.confetti_canvas} />
        <Drawer
          sx={{
            width: LEFT_DRAWER_WIDTH,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: LEFT_DRAWER_WIDTH,
              boxSizing: "border-box",
              color: "#fff",
              background: "transparent",
            },
          }}
          variant="permanent"
          anchor="left"
        >
          <Header setTutorialOpen={setTutorialOpen} />
          <WorkspaceInfoAndActions
            modelVersionSuffix={modelVersionSuffix}
            setDownloadModelDialogOpen={setDownloadModelDialogOpen}
            setDownloadLabelsDialogOpen={setDownloadLabelsDialogOpen}
            setUploadLabelsDialogOpen={setUploadLabelsDialogOpen}
          />

          <SupportIconsBar sx={{ marginBottom: 3 }} />
          <SystemVersion />
        </Drawer>
      </Box>
    </>
  );
};
