
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux'
import { getWorkspaces, setActiveWorspace } from './workspaceConfigSlice'
import classes from "./workspace-config.module.css"
import Combobox from '../../components/combobox/Combobox';
import { useNavigate } from "react-router-dom";

const Workspaces = () => {
  let navigate = useNavigate();
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(getWorkspaces())
  }, [dispatch])

  const { workspaces, loading } = useSelector((state) => state.workspaces)
  const workspace = useSelector((state) => state.workspace)

  if (loading) return <p>Loading...</p>

  const handleChange = (e) => {
    dispatch(setActiveWorspace(e.target.value))
    navigate('/')
  };

  return (

    <div className={classes.container}>
      <div className={classes.hexagon}>
        <div>
          <label>Select an existing workspace</label>
        </div>
        <div><Combobox
          options={workspaces.map((item) => ({ value: item, title: item }))}
          name={workspace}
          label="Select workspace"
          handleChange={handleChange}
        />
        </div>
      </div>
      <div className={classes.hexagon}>
        <div>
          <label>Create a new workspace</label>
        </div>
        <div> </div>
      </div>
      <div className={classes.hexagon}>
        <div>
          <label>Load new documents</label>
        </div>
        <div>  </div>
      </div>
    </div>
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