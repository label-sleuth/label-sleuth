import { configureStore } from '@reduxjs/toolkit'
import { workspacesReducer } from '../modules/Workspace-config/workspaceConfigSlice'
import { authenticateReducer } from '../modules/Login/LoginSlice'
import workspaceReducer from '../modules/Workplace/DataSlice'

export default configureStore({
  reducer: {
    authenticate: authenticateReducer,
    workspaces: workspacesReducer,
    workspace: workspaceReducer
  }
})