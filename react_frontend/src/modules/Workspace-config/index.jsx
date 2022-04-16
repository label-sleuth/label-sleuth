
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux'
import { getWorkspaces } from './workspaceConfigSlice'
import classes from "./workspace-config.module.css"
import ExistingWorkspace from "./ExistingWorkspace"
import NewWorkspace from "./NewWorkspace"
import LoadDocument from "./LoadDocument"
import workspaceConfigIcon from "../../assets/workspace-config/workspace.png"
import uploadDocIcon from "../../assets/workspace-config/upload.png"
import logoutIcon from "../../assets/workspace-config/logoutIcon.jpeg"

const Workspaces = () => {

  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(getWorkspaces())
  }, [dispatch])

  return (
    <>
      <div className={classes.container}>
        <div className={classes.hexagon}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img alt="existing workspace" src={workspaceConfigIcon} style={{ width: '25%' }} />
          </div>
          <ExistingWorkspace />
        </div>
        <div className={classes.hexagon}>
          <NewWorkspace />
        </div>
        <div className={classes.hexagon}>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-40px' }}>
            <img alt="load document" src={uploadDocIcon} style={{ width: '25%' }} />
          </div>
          <LoadDocument />
        </div>
        <div className={classes.hexagon}>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-40px' }}>
            <img alt="logout" src={logoutIcon} style={{ width: '50%' }} />
          </div>
        </div>
      </div>
    </>

  )
};

const workspaces = {
  routeProps: {
    path: "/workspaces",
    element: <Workspaces />
  },
  name: 'workspaces'
}
export default workspaces;