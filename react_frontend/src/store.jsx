import { configureStore } from '@reduxjs/toolkit'
import WorkspaceReducer from './modules/Workplace/DataSlice'

export default configureStore({
    reducer: {
        workspace: WorkspaceReducer
    }
})