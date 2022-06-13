import './App.css';
import { Routes, Route } from 'react-router-dom';
import Login from './modules/Login/index';
import WorkspaceConfig from './modules/Workspace-config/index';
import Workplace from './modules/Workplace';
import { PrivateRoute } from './features/PrivateRoute'
import {WORKSPACE_CONFIG_PATH, WORKSPACE_PATH} from './config'

function App() {

  return (
    <div>
      <Routes>
        <Route path="/" element={<Login />} />
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
              <Workplace />
          }
        />
      </Routes>
    </div>
  );
}

export default App;
