import { configureStore } from '@reduxjs/toolkit'
import { workspacesReducer } from '../modules/Workspace-config/workspaceConfigSlice'
import { authenticateReducer } from '../modules/Login/LoginSlice'

export default configureStore({
  reducer: {
    authenticate: authenticateReducer,
    workspaces: workspacesReducer,
  }
})