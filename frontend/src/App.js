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

import "./App.css";
import { Routes, Route } from "react-router-dom";
import Login from "./modules/Login/index";
import WorkspaceConfig from "./modules/Workspace-config/index";
import Workplace from "./modules/Workplace";
import { PrivateRoute } from "./features/PrivateRoute";
import { WORKSPACE_CONFIG_PATH, WORKSPACE_PATH, LOGIN_PATH } from "./config";
import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import theme from "./theme.jsx";
import { Backdrop } from "@mui/material";
import { CircularProgress } from "@mui/material";
import useAuthentication from "./modules/Login/customHooks/useAuthentication";
import { fetchFeatureFlags } from "./featureFlags/featureFlagsSlice";
import { useErrorHandler } from "./error/useErrorHandler";

const AppRoutes = () => {
  const { authenticated, authenticationEnabled } = useAuthentication();
  
  return (
    <Routes>
      <Route
        path={LOGIN_PATH}
        exact
        element={
          authenticationEnabled ? (
            <Login />
          ) : (
            <Navigate to={WORKSPACE_CONFIG_PATH} />
          )
        }
      />
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
          !authenticationEnabled || authenticated ? (
            <Navigate to={WORKSPACE_CONFIG_PATH} />
          ) : (
            <Navigate to={LOGIN_PATH} />
          )
        }
      />
    </Routes>
  );
};

const App = () => {
  const dispatch = useDispatch();

  const featureFlags = useSelector((state) => state.featureFlags);

  useErrorHandler()

  useEffect(() => {
    dispatch(fetchFeatureFlags());
  }, [dispatch]);

  return (
    <div>
      {featureFlags.fetched ? (
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ThemeProvider>
      ) : (
        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={true}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      )}
    </div>
  );
};

export default App;
