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

import * as React from "react";
import { useCallback } from "react";
import ReactCanvasConfetti from "react-canvas-confetti";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Typography from "@mui/material/Typography";
import sleuth_logo from "../../../assets/sleuth_logo_white.svg";
import info_icon from "../../../assets/workspace/help.svg";
import logout_icon from "../../../assets/workspace/logout.svg";
import workspace_icon from "../../../assets/workspace/change_catalog.svg";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { Tooltip } from "@mui/material";
import { SystemVersion } from "../../../components/version/SystemVersion";
import { useNavigate } from "react-router-dom";
import classes from "./WorkspaceInfo.module.css";
import { WORKSPACE_CONFIG_PATH } from "../../../config";
import { toast } from "react-toastify";
import {
  LOGOUT_TOOLTIP_MSG,
  GO_TO_WORKSPACE_CONFIG_TOOLTIP_MSG,
  NO_MODEL_AVAILABLE_MSG,
  LABEL_SLEUTH_SHORT_DESC,
  NEXT_MODEL_TRAINING_MSG,
  NEXT_ZERO_SHOT_MODEL_TRAINING_MSG,
  LEFT_DRAWER_WIDTH,
} from "../../../const";
import LinearWithValueLabel from "./ModelProgressBar";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import {
  UploadLabelsDialog,
  DownloadLabelsDialog,
  DownloadModelDialog,
} from "./FileTransferLabels/TransferLabelsDialog";
import { getOrdinalSuffix } from "../../../utils/utils";
import { ModelErrorAlert } from "./ModelErrorAlert";
import { SupportIconsBar } from "../../../components/SupportIconsBar";
import { DrawerHeader } from "./DrawerHeader";
import { Divider } from "./Divider";
import { StatsContainer } from "./StatsContainer";
import { TabPanel } from "./TabPanel";

import { useCheckModelState } from "../../../customHooks/useCheckModelState";
import { useConfetti } from "../../../customHooks/useConfetti";
import { useNewModelNotifications } from "../../../customHooks/useNewModelNotifications";
import { useWorkspaceId } from "../../../customHooks/useWorkspaceId";
import { useLogOut } from "../../../customHooks/useLogOut";
import { useAuthentication } from "../../../customHooks/useAuthentication";

import { useAppSelector, useAppDispatch } from "../../../customHooks/useRedux";
import { fetchVersion } from "../redux";

const a11yProps = (index: number) => ({
  id: `simple-tab-${index}`,
  "aria-controls": `simple-tabpanel-${index}`,
});

interface WorkspaceInfoProps {
  setTutorialOpen: React.Dispatch<React.SetStateAction<boolean>>;
  checkModelInterval?: number;
  shouldFireConfetti?: boolean;
}

const LabelCountComponent = () => {
  const [tabValue, setTabValue] = React.useState(0);
  const labelCount = useAppSelector((state) => state.workspace.labelCount);
  const curCategory = useAppSelector((state) => state.workspace.curCategory);
  const theme = useTheme();

  const handleChange = (event: React.SyntheticEvent<Element, Event>, newValue: number) => {
    setTabValue(newValue);
  };

  React.useEffect(() => {
    setTabValue(0)
  }, [curCategory])

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: "#393939" }}>
        <Tabs
          className={classes.tabroot}
          value={tabValue}
          onChange={handleChange}
          aria-label="workspace toggle tab"
          variant="fullWidth"
          sx={{padding: theme.spacing(0, 2)}}
        >
          <Tab label="User labels" {...a11yProps(0)} className={classes.tabs} 
                sx={{ textTransform: "none" }}
                />
          {labelCount.weakPos > 0 || labelCount.weakNeg > 0 ? (
            <Tab label="System-generated labels" {...a11yProps(1)} className={classes.tabs} 
            sx={{ textTransform: "none" }}
            />
          ) : null}
        </Tabs>
      </Box>
      <Box sx={{ width: "100%", padding: theme.spacing(0, 2) }}>
        <TabPanel className={classes.entries_tab} value={tabValue} index={0}>
          <Stack spacing={0}>
            <StatsContainer>
              <Typography>
                <strong>Positive</strong>
              </Typography>
              <Typography
                sx={{
                  color: labelCount.pos > 0 ? "#8ccad9" : "#fff",
                }}
              >
                <strong>{labelCount.pos}</strong>
              </Typography>
            </StatsContainer>
            <StatsContainer>
              <Typography>
                <strong>Negative</strong>
              </Typography>
              <Typography
                sx={{
                  color: labelCount.neg > 0 ? "#ff758f" : "#fff",
                }}
              >
                <strong>{labelCount.neg}</strong>
              </Typography>
            </StatsContainer>
            <StatsContainer>
              <Typography>
                <strong>Total</strong>
              </Typography>
              <Typography>
                <strong>{labelCount.pos + labelCount.neg}</strong>
              </Typography>
            </StatsContainer>
          </Stack>
        </TabPanel>
        {labelCount.weakPos > 0 || labelCount.weakNeg > 0 ? (
          <TabPanel className={classes.entries_tab} value={tabValue} index={1}>
            <Stack spacing={0}>
              <StatsContainer>
                <Typography>
                  <strong>Positive</strong>
                </Typography>
                <Typography sx={{ color: labelCount.weakPos > 0 ? "#8ccad9" : "#fff" }}>
                  <strong>{labelCount.weakPos}</strong>
                </Typography>
              </StatsContainer>
              <StatsContainer>
                <Typography>
                  <strong>Negative</strong>
                </Typography>
                <Typography sx={{ color: labelCount.weakNeg > 0 ? "#ff758f" : "#fff" }}>
                  <strong>{labelCount.weakNeg}</strong>
                </Typography>
              </StatsContainer>
              <StatsContainer>
                <Typography>
                  <strong>Total</strong>
                </Typography>
                <Typography>
                  <strong>{labelCount.weakPos + labelCount.weakNeg}</strong>
                </Typography>
              </StatsContainer>
            </Stack>
          </TabPanel>
        ) : null}
      </Box>
    </Box>
  );
};

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
  const navigate = useNavigate();
  const { logout } = useLogOut();

  const dispatch = useAppDispatch();

  const curCategory = useAppSelector((state) => state.workspace.curCategory);
  const labelCount = useAppSelector((state) => state.workspace.labelCount);
  const uploadedLabels = useAppSelector((state) => state.workspace.uploadedLabels);
  const modelVersion = useAppSelector((state) => state.workspace.modelVersion);
  const nextModelShouldBeTraining = useAppSelector((state) => state.workspace.nextModelShouldBeTraining);
  const lastModelFailed = useAppSelector((state) => state.workspace.lastModelFailed);

  const modelVersionSuffix = React.useMemo(
    () => (modelVersion !== null ? getOrdinalSuffix(modelVersion) : null),
    [modelVersion]
  );

  const [uploadLabelsDialogOpen, setUploadLabelsDialogOpen] = React.useState(false);
  const [downloadLabelsDialogOpen, setDownloadLabelsDialogOpen] = React.useState(false);
  const [downloadModelDialogOpen, setDownloadModelDialogOpen] = React.useState(false);

  const { authenticationEnabled } = useAuthentication();
  const { workspaceId } = useWorkspaceId();
  
  const theme = useTheme();

  const notifySuccess = useCallback((message, toastId, autoClose = false) => {
    toast(message, {
      autoClose: autoClose,
      type: toast.TYPE.SUCCESS,
      toastId: toastId,
    });
  }, []);

  const notifyWarning = useCallback((message, toastId, autoClose = false) => {
    toast(message, {
      autoClose: autoClose,
      type: toast.TYPE.WARNING,
      toastId: toastId,
    });
  }, []);

  useCheckModelState({ checkModelInterval });

  React.useEffect(() => {
    dispatch(fetchVersion());
  }, [dispatch]);

  const { getInstance, fire } = useConfetti();

  useNewModelNotifications({
    curCategory,
    modelVersion,
    notifySuccess,
    shouldFireConfetti,
    fire,
  });

  const open_introSlides = function () {
    setTutorialOpen(true);
  };

  const getCategoriesString = (categories: string[]) => {
    if (categories.length === 1) return categories[0];
    else {
      let res = "";
      if (categories.length > 2) categories.slice(0, -2).forEach((c) => (res += `'${c}', `));
      res += `'${categories.slice(-2, -1)[0]}' and '${categories.slice(-1)[0]}'`;
      return res;
    }
  };

  React.useEffect(() => {
    if (uploadedLabels) {
      const categoriesCreated = uploadedLabels.categoriesCreated;
      const createdCategoriesMessage = categoriesCreated.length
        ? `Added categories are: ${getCategoriesString(categoriesCreated)}`
        : "";
      notifySuccess(`New labels have been added! ${createdCategoriesMessage}`, "toast-uploaded-labels");

      // if the user uploaded labels that were contradicting display a warning notification
      const contractictingLabelsElementCount = uploadedLabels.contracticting_labels_info.elements.length;
      if (contractictingLabelsElementCount > 0) {
        const warningMessage = `You uploaded contradicting labels for ${contractictingLabelsElementCount} element${
          contractictingLabelsElementCount > 1 ? "s" : ""
        }`;
        notifyWarning(warningMessage, "toast-contractictingLabelsInfo");
      }
    }
  }, [uploadedLabels, notifySuccess, notifyWarning]);

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
          // open={open}
          anchor="left"
        >
          <DrawerHeader>
            <h2 className={classes.sleuth_title}>
              <img src={sleuth_logo} className={classes.sleuthlogo} alt="Sleuth Logo" />
              <img
                id="workspace-tutorial-image"
                onClick={open_introSlides}
                src={info_icon}
                className={classes.moreinfo}
                alt="Open Tutorial"
              />
            </h2>
            {authenticationEnabled ? (
              <Tooltip title={LOGOUT_TOOLTIP_MSG} placement="right">
                <img onClick={logout} className={classes.logout} src={logout_icon} alt="logout" />
              </Tooltip>
            ) : null}
          </DrawerHeader>

          <p className={classes.sleuth_desc}>{LABEL_SLEUTH_SHORT_DESC}</p>

          <Divider />

          <DrawerHeader style={{ padding: "12px 16px", alignItems: "flex-end" }}>
            <div className={classes.account_info}>
              {authenticationEnabled ? (
                <div>
                  <label>User ID</label>
                  <p>
                    <b>{localStorage.username}</b>
                  </p>
                </div>
              ) : null}
              <label>Workspace</label>
              <p>
                <b>{workspaceId}</b>
              </p>
            </div>
            <Tooltip title={GO_TO_WORKSPACE_CONFIG_TOOLTIP_MSG} placement="right">
              <img
                onClick={() => {
                  navigate(WORKSPACE_CONFIG_PATH);
                }}
                className={classes.workspace_nav}
                src={workspace_icon}
                alt="Change to Another Workspace"
                style={{ marginBottom: "10px" }}
              />
            </Tooltip>
          </DrawerHeader>

          <Divider />
          {curCategory !== null ? (
            <Stack style={{ paddingTop: "12px", paddingBottom: "24px" }}>
              <LabelCountComponent />
              <Divider />
              <Stack
                direction="row"
                alignItems="flex-end"
                sx={{
                  paddingLeft: 2,
                  paddingRight: 0,
                  paddingBottom: 1.5,
                  paddingTop: 4,
                }}
              >
                {modelVersion && modelVersion > -1 ? (
                  <Typography id="model-version" style={{ whiteSpace: "nowrap" }}>
                    {"Current model: "}
                    <strong>
                      {modelVersion}
                      <sup>{modelVersionSuffix}</sup> version
                    </strong>
                  </Typography>
                ) : (
                  <Typography id="model-version-unavailable">
                    {"Current model: "}
                    <strong>{NO_MODEL_AVAILABLE_MSG}</strong>
                  </Typography>
                )}
                {modelVersion && modelVersion > -1 ? (
                  <Tooltip title={"Download model"} placement="top">
                    <Button
                      onClick={() => setDownloadModelDialogOpen(true)}
                      startIcon={<FileDownloadOutlinedIcon />}
                      sx={{
                        textTransform: "none",
                        padding: "0 0 0 20px",
                      }}
                    />
                  </Tooltip>
                ) : null}
              </Stack>
              <LinearWithValueLabel />
              {nextModelShouldBeTraining ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "flex-end",
                  }}
                >
                  {labelCount.pos === 0 && labelCount.neg === 0 ? (
                    <div className={classes.modelStatus}>{NEXT_ZERO_SHOT_MODEL_TRAINING_MSG}</div>
                  ) : (
                    <div className={classes.modelStatus}>{NEXT_MODEL_TRAINING_MSG}</div>
                  )}
                  <div className={classes["dot-pulse"]}></div>
                </div>
              ) : null}
              {lastModelFailed && <ModelErrorAlert />}
            </Stack>
          ) : null}
          <Divider />
          <Stack
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "start",
              padding: theme.spacing("24px", 2),
              flexGrow: "1",
            }}
          >
            <Typography>Workspace labeled data:</Typography>
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
              }}
            >
              <Button
                onClick={() => setDownloadLabelsDialogOpen(true)}
                startIcon={<FileDownloadOutlinedIcon />}
                sx={{ textTransform: "none" }}
              >
                Download
              </Button>
            </Stack>
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
              }}
            >
              <Button
                startIcon={<FileUploadOutlinedIcon />}
                component="label"
                onClick={() => setUploadLabelsDialogOpen(true)}
                sx={{ textTransform: "none" }}
              >
                Upload
              </Button>
            </Stack>
          </Stack>
          <SupportIconsBar sx={{ marginBottom: 3 }} />
          <SystemVersion />
        </Drawer>
      </Box>
    </>
  );
};
