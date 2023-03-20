import { useCallback } from "react";

import { Divider, Tooltip, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuthentication } from "../../../customHooks/useAuthentication";
import { useLogOut } from "../../../customHooks/useLogOut";
import { useWorkspaceId } from "../../../customHooks/useWorkspaceId";
import { DrawerHeader } from "./DrawerHeader";

import sleuth_logo from "../../../assets/sleuth_logo_white.svg";
import info_icon from "../../../assets/workspace/help.svg";
import logout_icon from "../../../assets/workspace/logout.svg";
import workspace_icon from "../../../assets/workspace/change_catalog.svg";

import classes from "./WorkspaceInfo.module.css";

import { WORKSPACE_CONFIG_PATH } from "../../../config";
import { LOGOUT_TOOLTIP_MSG, GO_TO_WORKSPACE_CONFIG_TOOLTIP_MSG, LABEL_SLEUTH_SHORT_DESC } from "../../../const";
import { useAppSelector } from "../../../customHooks/useRedux";
import { currentDocNameSelector } from "../redux/documentSlice";
import { getDatasetNameFromDocumentId } from "../../../utils/utils";

interface HeaderProps {
  setTutorialOpen: (value: boolean) => void;
}

export const Header = ({ setTutorialOpen }: HeaderProps) => {
  const curDocName = useAppSelector(currentDocNameSelector);
  const { logout } = useLogOut();
  const navigate = useNavigate();
  const { authenticationEnabled } = useAuthentication();
  const { workspaceId } = useWorkspaceId();

  const openTutorial = useCallback(() => setTutorialOpen(true), [setTutorialOpen]);

  return (
    <>
      <DrawerHeader>
        <h2 className={classes.sleuth_title}>
          <img src={sleuth_logo} className={classes.sleuthlogo} alt="Sleuth Logo" />
          <img
            id="workspace-tutorial-image"
            onClick={openTutorial}
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

      <DrawerHeader style={{ padding: "12px 16px" }}>
        <Stack direction="column" className={classes.account_info} flexGrow={1} >
          {authenticationEnabled ? (
            <div>
              <label>User ID</label>
              <p>
                <b>{localStorage.username}</b>
              </p>
            </div>
          ) : null}
          <Stack direction="row" alignItems="center">
            <div style={{ flexGrow: 1 }}>
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
              />
            </Tooltip>
          </Stack>

          <label style={{ marginTop: "15px" }}>Dataset</label>
          <p>
            <b>{getDatasetNameFromDocumentId(curDocName)}</b>
          </p>
        </Stack>
      </DrawerHeader>

      <Divider />
    </>
  );
};
