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

import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./modules/Login/index";
import WorkspaceConfig from "./modules/Workspace-config/index";
import { Workplace } from "./modules/Workplace";
import { PrivateRoute } from "./features/PrivateRoute";
import { WORKSPACE_CONFIG_PATH, WORKSPACE_PATH, LOGIN_PATH } from "./config";
import { Navigate } from "react-router-dom";
import { HashRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { useAppSelector, useAppDispatch } from "./customHooks/useRedux";
import theme from "./theme.jsx";
import { Backdrop } from "@mui/material";
import { CircularProgress } from "@mui/material";
import { useAuthentication } from "./customHooks/useAuthentication";
import { fetchFeatureFlags } from "./featureFlags/featureFlagsSlice";
import { useNotifyError } from "./error/useNotifyError";
import { useWorkspaceId } from "./customHooks/useWorkspaceId";
import { fetchVersion } from "./modules/Workplace/redux";
import { useCheckSystemHealth } from "./customHooks/useCheckSystemHealth";

const AppRoutes = () => {
  const { authenticated, authenticationEnabled } = useAuthentication();
  const { workspaceId } = useWorkspaceId();

  return (
    <Routes>
      <Route path={LOGIN_PATH} element={authenticationEnabled ? <Login /> : <Navigate to={WORKSPACE_CONFIG_PATH} />} />
      <Route
        path={WORKSPACE_CONFIG_PATH}
        element={
          <PrivateRoute>
            <WorkspaceConfig />
          </PrivateRoute>
        }
      />
      <Route
        path={WORKSPACE_PATH}
        element={
          workspaceId ? (
            <PrivateRoute>
              <Workplace />
            </PrivateRoute>
          ) : (
            <Navigate to={WORKSPACE_CONFIG_PATH} />
          )
        }
      />
      <Route
        path="/"
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
  const dispatch = useAppDispatch();

  const featureFlags = useAppSelector((state) => state.featureFlags);

  useNotifyError();

  const { systemOk } = useCheckSystemHealth();

  useEffect(() => {
    dispatch(fetchFeatureFlags());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchVersion());
  }, [dispatch]);

  return (
    <div>
      {featureFlags.fetched ? (
        <ThemeProvider theme={theme}>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </ThemeProvider>
      ) : (
        <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={true}>
          <CircularProgress color="inherit" />
        </Backdrop>
      )}
      <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={!systemOk}></Backdrop>
    </div>
  );
};

export default App;
