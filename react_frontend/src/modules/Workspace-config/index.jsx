import React, { useEffect } from 'react';
import { getDatasetsAPI } from './workspaceConfigSlice'
import classes from "./workspace-config.module.css"
import ExistingWorkspace from "./ExistingWorkspaceForm"
import NewWorkspace from "./NewWorkspaceForm"
import LoadDocument from "./LoadDocumentForm"
import workspaceConfigIcon from "../../assets/workspace-config/existing_workspace.png"
import uploadDocIcon from "../../assets/workspace-config/upload.png"
import ButtonAppBar from "../../components/bars/upperBar/ButtonAppBar"
import new_workspace_icon from "../../assets/workspace-config/create_new_workspace.png"
import { ToastContainer } from 'react-toastify';
import { useDispatch } from 'react-redux'
import useLoadDoc from './useLoadDoc';
import useNewWorkspace from './useNewWorkspace';
import useLogOut from '../../customHooks/useLogOut';
import useExistWorkspace from './useExistWorkspace';
import workspace_logo from "../../assets/workspace-config/tag--edit.svg"

const WorkspaceConfig = () => {
  const dispatch = useDispatch()
  const loadDocProps = useLoadDoc()
  const { options } = loadDocProps
  const newWorkProps = useNewWorkspace()
  const existingWorkProps = useExistWorkspace()
  const { logout } = useLogOut()

  useEffect(() => {
    dispatch(getDatasetsAPI())
  }, [dispatch])

  return (
    <>
      <ButtonAppBar logout={logout} />
      <ToastContainer position="top-center" />
      <div className={classes.container}>
        <div/>
        <div>
          <h2 style={{display: 'flex', alignItems: 'center'}}><img src={workspace_logo} style={{height: '30px', marginRight: '5px', marginBottom: '3px'}}/>Workspace</h2>
          <ExistingWorkspace {...existingWorkProps} />
          <p style={{
            marginTop: '10px',
            marginBottom: '10px',
            marginLeft: '5px',
            color: '#d5d5d5'
          }}>--- or ---</p>
          <NewWorkspace  {...newWorkProps} options={options} />
        </div>
        <div className={classes.newdata}>
          <LoadDocument {...loadDocProps} />
        </div>
      </div>
    </>

  )
};

export default WorkspaceConfig;