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

import './App.css';
import { Routes, Route } from 'react-router-dom';
import Login from './modules/Login/index';
import WorkspaceConfig from './modules/Workspace-config/index';
import Workplace from './modules/Workplace';
import { PrivateRoute } from './features/PrivateRoute'
import {AUTH_ENABLED, WORKSPACE_CONFIG_PATH, WORKSPACE_PATH, LOGIN_PATH} from './config'
import React from 'react';
import { Navigate } from 'react-router-dom'
import { useAuth } from './customHooks/useAuth';

function App() {
  const isAuthenticated = useAuth()
  return (
    <div>
      <Routes>
        {AUTH_ENABLED ? <Route path={LOGIN_PATH} exact element={<Login />}/> : null}
        <Route
          path={WORKSPACE_CONFIG_PATH}
          exact
          element={
            <PrivateRoute>
              <WorkspaceConfig />
            </PrivateRoute>
          }
        />
        <Route
          path={WORKSPACE_PATH}
          exact
          element={
            <PrivateRoute>
              <Workplace />
            </PrivateRoute>
          }
        />
        <Route
          path="/"
          exact
          element={
            isAuthenticated ? <Navigate to={WORKSPACE_CONFIG_PATH}/> : <Navigate to={LOGIN_PATH}/> 
          }
        />
      </Routes>
    </div>
  );
}

export default App;
