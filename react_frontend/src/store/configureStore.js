import { configureStore } from '@reduxjs/toolkit'
import { workspacesReducer } from '../modules/Workspace-config/workspaceConfigSlice'

export default configureStore({
  reducer: {
    workspaces: workspacesReducer
  }
})