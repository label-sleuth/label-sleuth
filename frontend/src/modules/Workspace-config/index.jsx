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

import React, { useEffect } from 'react';
import { clearState, getDatasets } from './workspaceConfigSlice'
import { cleanWorkplaceState } from '../Workplace/DataSlice'
import classes from "./workspace-config.module.css"
import ExistingWorkspace from "./ExistingWorkspaceForm"
import NewWorkspace from "./NewWorkspaceForm"
import LoadDocument from "./LoadDocumentForm"
import ButtonAppBar from "../../components/bars/upperBar/ButtonAppBar"
import { ToastContainer } from 'react-toastify';
import { useDispatch } from 'react-redux'
import useLoadDoc from './useLoadDoc';
import useNewWorkspace from './useNewWorkspace';
import useLogOut from '../../customHooks/useLogOut';
import useExistWorkspace from './useExistWorkspace';
import workspace_logo from "../../assets/workspace-config/tag--edit.svg"
import { toast } from 'react-toastify';
import useBackdrop from '../../customHooks/useBackdrop';

const WorkspaceConfig = () => {
  const dispatch = useDispatch()
  const { logout } = useLogOut()
  const {openBackdrop} = useBackdrop()

  useEffect(() => {
    dispatch(getDatasets())
    dispatch(cleanWorkplaceState())
  }, [dispatch])

  const toastId = "workspace-config-toast-id";
  function notify(message, func) {

    toast(message, {
      autoClose: false,
      type: toast.TYPE.INFO,
      toastId: toastId,
    });
    func(message)
    dispatch(clearState())
  }


  const loadDocProps = useLoadDoc(notify, toastId)
  const { options } = loadDocProps
  const newWorkProps = useNewWorkspace(notify, toastId)
  const existingWorkProps = useExistWorkspace(notify, toastId)

  return (
    <>
      <ButtonAppBar logout={logout} />
      <ToastContainer position="top-center" theme='dark' limit={1} />
      <div className={classes.container}>
        <div />
        <div style={{maxWidth: "362px"}}>
          <h2 style={{ display: 'flex', alignItems: 'center', marginTop: 0 }}><img src={workspace_logo} style={{ height: '28px', marginLeft: '3px', marginRight: '5px' }} />Workspace</h2>
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
          <LoadDocument {...loadDocProps} openBackdrop={openBackdrop} />
        </div>
      </div>
    </>

  )
};

export default WorkspaceConfig;