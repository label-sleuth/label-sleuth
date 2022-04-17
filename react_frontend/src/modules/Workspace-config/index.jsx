
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux'
import { useNavigate } from "react-router-dom";
import { getWorkspaces } from './workspaceConfigSlice'
import classes from "./workspace-config.module.css"
import ExistingWorkspace from "./ExistingWorkspace"
import NewWorkspace from "./NewWorkspace"
import LoadDocument from "./LoadDocument"
import workspaceConfigIcon from "../../assets/workspace-config/workspace.png"
import uploadDocIcon from "../../assets/workspace-config/upload.png"
import logoutIcon from "../../assets/workspace-config/logoutIcon.jpeg"
import ButtonAppBar from "../../components/bars/upperBar/ButtonAppBar" 

const Workspaces = () => {

  const dispatch = useDispatch()
  const navigate = useNavigate() 

  useEffect(() => {
    dispatch(getWorkspaces())
  }, [dispatch])

  const logout = () =>{
    navigate('../login')
  }


  return ( 
    <>
      <ButtonAppBar  logout={logout} />
      <div className={classes.container}>
        <div className={classes.hexagon}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img alt="existing workspace" src={workspaceConfigIcon} style={{ width: '30%' }} />
          </div>
          <ExistingWorkspace/>
        </div>
        <div className={classes.hexagon}>
          <NewWorkspace />
        </div>
        <div className={classes.hexagon}>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-50px', marginBottom: '10px' }}>
            <img alt="load document" src={uploadDocIcon} style={{ width: '30%' }} />
          </div>
          <LoadDocument />
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