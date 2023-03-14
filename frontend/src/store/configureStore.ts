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

import { configureStore } from "@reduxjs/toolkit";
import { workspacesReducer } from "../modules/Workspace-config/workspaceConfigSlice";
import { authenticateReducer } from "../modules/Login/LoginSlice";
import { featureFlagsReducer } from "../featureFlags/featureFlagsSlice";
import { errorReducer } from "../error/errorSlice";
import { errorMiddleware } from "../error/errorMiddleware";
import workspaceReducer  from "../modules/Workplace/redux";

export const setupStore = (preloadedState?: any) : any =>
  configureStore({
    reducer: {
      authenticate: authenticateReducer,
      workspaces: workspacesReducer,
      workspace: workspaceReducer,
      featureFlags: featureFlagsReducer,
      error: errorReducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(errorMiddleware),
});

export const store = setupStore();


export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

  