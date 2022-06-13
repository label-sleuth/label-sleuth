import { Navigate } from 'react-router-dom';
import { useAuth } from '../customHooks/useAuth'
import { LOGIN_PATH } from '../config';

export function PrivateRoute({ redirectPath = LOGIN_PATH, children, }) {
  const auth = useAuth();
  if (!auth) {
    return <Navigate to={redirectPath} replace />;
  }
  return children;
};