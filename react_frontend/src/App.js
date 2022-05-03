import './App.css';
import { Routes, Route } from 'react-router-dom';
import Login from './modules/Login/index';
import WorkspaceConfig from './modules/Workspace-config/index';
import Workplace from './modules/Workplace';
import { PrivateRoute } from './features/PrivateRoute'

function App() {

  return (
    <div>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/workspaces"
          exact
          element={
            <PrivateRoute>
              <WorkspaceConfig />
            </PrivateRoute>
          }
        />
        <Route
          path="/workspace"
          exact
          element={
            <PrivateRoute>
              <Workplace />
            </PrivateRoute>

          }
        />
      </Routes>

    </div>
  );
}

export default App;
