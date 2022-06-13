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
