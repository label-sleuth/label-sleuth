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
        <div className={classes.hexagon}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <img alt="existing workspace" src={workspaceConfigIcon} style={{ width: '25%' }} />
          </div>
          <ExistingWorkspace {...existingWorkProps} />
        </div>
        <div className={classes.hexagon}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img alt="new workspace" src={new_workspace_icon} style={{ width: '20%' }} />
          </div>
          <NewWorkspace  {...newWorkProps} options={options} />
        </div>
        <div className={classes.hexagon}>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-20px' }}>
            <img alt="load document" src={uploadDocIcon} style={{ width: '35%' }} />
          </div>
          <LoadDocument {...loadDocProps} />
        </div>
      </div>
    </>

  )
};

export default WorkspaceConfig;