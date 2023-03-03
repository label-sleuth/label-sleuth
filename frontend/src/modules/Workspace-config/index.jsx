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

import { useEffect } from "react";
import { clearState, getDatasets } from "./workspaceConfigSlice";
import { cleanWorkplaceState } from "../Workplace/redux";
import classes from "./workspace-config.module.css";
import ExistingWorkspace from "./ExistingWorkspaceForm";
import NewWorkspace from "./NewWorkspaceForm";
import LoadDocument from "./LoadDocumentForm";
import ButtonAppBar from "../../components/bars/upperBar/ButtonAppBar";
import { useDispatch } from "react-redux";
import { useLoadDoc } from "../../customHooks/useLoadDoc";
import useNewWorkspace from "../../customHooks/useNewWorkspace";
import { useLogOut } from "../../customHooks/useLogOut";
import useExistWorkspace from "../../customHooks/useExistWorkspace";
import workspace_logo from "../../assets/workspace-config/tag--edit.svg";
import { toast } from "react-toastify";
import useBackdrop from "../../customHooks/useBackdrop";
import { useWorkspaceId } from "../../customHooks/useWorkspaceId";
import { SystemVersion } from "../../components/version/SystemVersion";

const WorkspaceConfig = () => {
  const dispatch = useDispatch();
  const { logout } = useLogOut();
  const { backdropOpen } = useBackdrop();
  const { setWorkspaceId } = useWorkspaceId();

  useEffect(() => {
    dispatch(getDatasets());
    dispatch(cleanWorkplaceState());
    setWorkspaceId(null);
  }, [setWorkspaceId, dispatch]);

  const toastId = "workspace-config-toast-id";

  const loadDocProps = useLoadDoc({ toastId });
  const { options } = loadDocProps;
  const newWorkProps = useNewWorkspace(toastId);
  const existingWorkProps = useExistWorkspace({ toastId });

  return (
    <>
      <ButtonAppBar logout={logout} />
      <div className={classes.container}>
        <div />
        <div style={{ maxWidth: "362px" }}>
          <h2 style={{ display: "flex", alignItems: "center", marginTop: 0 }}>
            <img alt="" src={workspace_logo} style={{ height: "28px", marginLeft: "3px", marginRight: "5px" }} />
            Workspace
          </h2>
          <ExistingWorkspace {...existingWorkProps} />
          <p
            style={{
              marginTop: "10px",
              marginBottom: "10px",
              marginLeft: "5px",
              color: "#d5d5d5",
            }}
          >
            --- or ---
          </p>
          <NewWorkspace {...newWorkProps} options={options} />
        </div>
        <div className={classes.newdata}>
          <LoadDocument {...loadDocProps} backdropOpen={backdropOpen} />
        </div>
        <SystemVersion style={{ position: "absolute", right: 10, bottom: -20 }} />
      </div>
    </>
  );
};

export default WorkspaceConfig;
